import { createClient } from '@/lib/supabase/server'
import { groq } from '@ai-sdk/groq'
import { streamText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { calculateTokens, saveMessage, trackUsage, deductCredits, updateConversationTitle, getPromptById, linkPromptToConversation } from '@/lib/db/queries'

const MODEL = 'mixtral-8x7b-32768'
const DEFAULT_SYSTEM_PROMPT = `You are ARIX.help, a helpful AI assistant specialized in coding, design, app development, SaaS, SEO, and web development. You provide practical, actionable advice and code examples when relevant. Be concise, clear, and always provide the most valuable information first.`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messages, conversationId, promptId } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    // Validate conversation exists and belongs to user
    if (conversationId) {
      const { data: conversation, error: convError } = await supabase
        .from('ai_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()

      if (convError || !conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }
    }

    // Check user profile and credits
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('credits_remaining, subscription_tier')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if user has credits (free tier: 10/day, pro: unlimited)
    if (userProfile.subscription_tier === 'free' && userProfile.credits_remaining <= 0) {
      return NextResponse.json(
        { error: 'Daily free query limit reached. Upgrade to Pro for unlimited access.' },
        { status: 429 }
      )
    }

    // Get the user's message
    const userMessage = messages[messages.length - 1]
    const userMessageTokens = calculateTokens(userMessage.content)

    // Save user message to database BEFORE streaming response
    if (conversationId) {
      const savedUserMsg = await saveMessage(
        conversationId,
        user.id,
        'user',
        userMessage.content,
        userMessageTokens
      )

      if (!savedUserMsg) {
        console.error('[v0] Failed to save user message')
        return NextResponse.json(
          { error: 'Failed to save message' },
          { status: 500 }
        )
      }
    }

    // Get the system prompt based on promptId
    let systemPrompt = DEFAULT_SYSTEM_PROMPT
    
    if (promptId) {
      try {
        const prompt = await getPromptById(promptId)
        if (prompt) {
          systemPrompt = prompt.system_prompt
          
          // Link prompt to conversation on first use
          if (conversationId) {
            await linkPromptToConversation(conversationId, promptId)
          }
        }
      } catch (error) {
        console.error('[v0] Failed to get prompt:', error)
        // Continue with default prompt
      }
    }

    // Collect AI response before streaming
    let aiResponseContent = ''

    // Stream the response from Groq
    const result = await streamText({
      model: groq(MODEL),
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      system: systemPrompt,
      onFinish: async (completion) => {
        // This runs after streaming completes
        const aiResponseTokens = calculateTokens(completion.text)

        // Save AI response to database
        if (conversationId) {
          const savedAiMsg = await saveMessage(
            conversationId,
            user.id,
            'assistant',
            completion.text,
            aiResponseTokens
          )

          if (!savedAiMsg) {
            console.error('[v0] Failed to save AI message')
          }

          // Auto-generate conversation title from first message if it's still "New Conversation"
          const { data: conversation } = await supabase
            .from('ai_conversations')
            .select('title')
            .eq('id', conversationId)
            .single()

          if (conversation && conversation.title === 'New Conversation') {
            // Create a short title from first user message (max 50 chars)
            const shortTitle = userMessage.content.substring(0, 50)
            await updateConversationTitle(conversationId, user.id, shortTitle)
          }
        }

        // Deduct credits for free tier
        if (userProfile.subscription_tier === 'free') {
          await deductCredits(user.id, 1)
        }

        // Track usage
        const totalTokens = userMessageTokens + aiResponseTokens
        await trackUsage(user.id, 'ai_query', totalTokens)
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('[v0] Chat API error:', error)

    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: `Failed to process request: ${errorMessage}` },
      { status: 500 }
    )
  }
}
