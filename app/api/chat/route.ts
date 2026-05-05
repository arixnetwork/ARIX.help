import { createClient } from '@/lib/supabase/server'
import { groq } from '@ai-sdk/groq'
import { streamText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

const MODEL = 'mixtral-8x7b-32768'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messages, conversationId } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    // Check user credits
    const { data: userProfile } = await supabase
      .from('users')
      .select('credits_remaining, subscription_tier')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if user has credits (free tier: 10/day, pro: unlimited)
    if (userProfile.subscription_tier === 'free' && userProfile.credits_remaining <= 0) {
      return NextResponse.json(
        { error: 'Daily free query limit reached. Upgrade to Pro for unlimited access.' },
        { status: 429 }
      )
    }

    // Stream the response from Groq
    const result = await streamText({
      model: groq(MODEL),
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      system: `You are ARIX.help, a helpful AI assistant specialized in coding, design, app development, SaaS, SEO, and web development. You provide practical, actionable advice and code examples when relevant. Be concise, clear, and always provide the most valuable information first.`,
    })

    // Update conversation in database if provided
    if (conversationId) {
      const userMessage = messages[messages.length - 1]
      
      // Save user message
      await supabase.from('ai_messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: userMessage.content,
        tokens_used: Math.ceil(userMessage.content.length / 4),
      })
    }

    // Decrement credits for free tier
    if (userProfile.subscription_tier === 'free') {
      await supabase
        .from('users')
        .update({ credits_remaining: userProfile.credits_remaining - 1 })
        .eq('id', user.id)
    }

    // Track usage
    await supabase.from('usage_tracking').insert({
      user_id: user.id,
      action_type: 'ai_query',
      tokens_used: Math.ceil(messages[messages.length - 1].content.length / 4),
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
