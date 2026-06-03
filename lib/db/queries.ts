import { createClient } from '@/lib/supabase/server'

export async function getConversationMessages(conversationId: string, userId: string) {
  try {
    const supabase = await createClient()
    
    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()
    
    if (convError || !conversation) {
      console.error('[v0] Conversation not found or unauthorized')
      return null
    }
    
    // Fetch all messages
    const { data: messages, error: messagesError } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    
    if (messagesError) {
      console.error('[v0] Failed to fetch messages:', messagesError)
      return null
    }
    
    return messages
  } catch (error) {
    console.error('[v0] Error fetching conversation messages:', error)
    return null
  }
}

export async function saveMessage(
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  tokensUsed: number
) {
  try {
    const supabase = await createClient()
    
    const { data: message, error } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role,
        content,
        tokens_used: tokensUsed,
      })
      .select()
      .single()
    
    if (error) {
      console.error('[v0] Failed to save message:', error)
      return null
    }
    
    return message
  } catch (error) {
    console.error('[v0] Error saving message:', error)
    return null
  }
}

export async function updateConversationTitle(
  conversationId: string,
  userId: string,
  title: string
) {
  try {
    const supabase = await createClient()
    
    const { data: conversation, error } = await supabase
      .from('ai_conversations')
      .update({ title })
      .eq('id', conversationId)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('[v0] Failed to update conversation title:', error)
      return null
    }
    
    return conversation
  } catch (error) {
    console.error('[v0] Error updating conversation title:', error)
    return null
  }
}

export async function getUserProfile(userId: string) {
  try {
    const supabase = await createClient()
    
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('[v0] Failed to fetch user profile:', error)
      return null
    }
    
    return userProfile
  } catch (error) {
    console.error('[v0] Error fetching user profile:', error)
    return null
  }
}

export async function deductCredits(userId: string, credits: number) {
  try {
    const supabase = await createClient()
    
    // Get current credits
    const { data: userProfile, error: selectError } = await supabase
      .from('users')
      .select('credits_remaining')
      .eq('id', userId)
      .single()
    
    if (selectError || !userProfile) {
      console.error('[v0] Failed to fetch user credits:', selectError)
      return false
    }
    
    // Update credits
    const { error: updateError } = await supabase
      .from('users')
      .update({
        credits_remaining: Math.max(0, userProfile.credits_remaining - credits),
      })
      .eq('id', userId)
    
    if (updateError) {
      console.error('[v0] Failed to deduct credits:', updateError)
      return false
    }
    
    return true
  } catch (error) {
    console.error('[v0] Error deducting credits:', error)
    return false
  }
}

export async function trackUsage(
  userId: string,
  actionType: string,
  tokensUsed: number
) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.from('usage_tracking').insert({
      user_id: userId,
      action_type: actionType,
      tokens_used: tokensUsed,
    })
    
    if (error) {
      console.error('[v0] Failed to track usage:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('[v0] Error tracking usage:', error)
    return false
  }
}

// Calculate approximate tokens based on content length
export function calculateTokens(content: string): number {
  // More accurate estimate: roughly 1 token per 4 characters for English
  // But also account for word boundaries
  const words = content.split(/\s+/).length
  const chars = content.length
  
  // Use the average of character-based and word-based estimates
  const charTokens = Math.ceil(chars / 4)
  const wordTokens = Math.ceil(words * 1.3) // Average ~1.3 tokens per word
  
  return Math.max(1, Math.min(charTokens, wordTokens))
}
