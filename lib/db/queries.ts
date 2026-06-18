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

// AI PROMPTS QUERIES

export async function getAllPrompts() {
  try {
    const supabase = await createClient()
    
    const { data: prompts, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
    
    if (error) {
      console.error('[v0] Failed to fetch prompts:', error)
      return []
    }
    
    return prompts || []
  } catch (error) {
    console.error('[v0] Error fetching prompts:', error)
    return []
  }
}

export async function getPromptById(promptId: string) {
  try {
    const supabase = await createClient()
    
    const { data: prompt, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('id', promptId)
      .single()
    
    if (error) {
      console.error('[v0] Failed to fetch prompt:', error)
      return null
    }
    
    return prompt
  } catch (error) {
    console.error('[v0] Error fetching prompt:', error)
    return null
  }
}

export async function getPromptByName(name: string) {
  try {
    const supabase = await createClient()
    
    const { data: prompt, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('name', name)
      .single()
    
    if (error) {
      console.error('[v0] Failed to fetch prompt:', error)
      return null
    }
    
    return prompt
  } catch (error) {
    console.error('[v0] Error fetching prompt:', error)
    return null
  }
}

export async function searchPrompts(query: string) {
  try {
    const supabase = await createClient()
    
    const { data: prompts, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .order('name', { ascending: true })
    
    if (error) {
      console.error('[v0] Failed to search prompts:', error)
      return []
    }
    
    return prompts || []
  } catch (error) {
    console.error('[v0] Error searching prompts:', error)
    return []
  }
}

export async function getPromptsByCategory(category: string) {
  try {
    const supabase = await createClient()
    
    const { data: prompts, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('is_active', true)
      .eq('category', category)
      .order('name', { ascending: true })
    
    if (error) {
      console.error('[v0] Failed to fetch prompts:', error)
      return []
    }
    
    return prompts || []
  } catch (error) {
    console.error('[v0] Error fetching prompts:', error)
    return []
  }
}

export async function getUserFavoritePrompts(userId: string) {
  try {
    const supabase = await createClient()
    
    const { data: favorites, error } = await supabase
      .from('user_prompt_preferences')
      .select('ai_prompts(*)')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .order('updated_at', { ascending: false })
    
    if (error) {
      console.error('[v0] Failed to fetch favorite prompts:', error)
      return []
    }
    
    return (favorites || []).map((f: any) => f.ai_prompts).filter(Boolean)
  } catch (error) {
    console.error('[v0] Error fetching favorite prompts:', error)
    return []
  }
}

export async function getUserRecentPrompts(userId: string, limit = 5) {
  try {
    const supabase = await createClient()
    
    const { data: recent, error } = await supabase
      .from('user_prompt_preferences')
      .select('ai_prompts(*)')
      .eq('user_id', userId)
      .not('last_used', 'is', null)
      .order('last_used', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('[v0] Failed to fetch recent prompts:', error)
      return []
    }
    
    return (recent || []).map((r: any) => r.ai_prompts).filter(Boolean)
  } catch (error) {
    console.error('[v0] Error fetching recent prompts:', error)
    return []
  }
}

export async function togglePromptFavorite(userId: string, promptId: string, isFavorite: boolean) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('user_prompt_preferences')
      .upsert({
        user_id: userId,
        prompt_id: promptId,
        is_favorite: isFavorite,
      }, { onConflict: 'user_id,prompt_id' })
      .select()
      .single()
    
    if (error) {
      console.error('[v0] Failed to update favorite:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('[v0] Error updating favorite:', error)
    return null
  }
}

export async function recordPromptUsage(userId: string, promptId: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('user_prompt_preferences')
      .upsert({
        user_id: userId,
        prompt_id: promptId,
        last_used: new Date().toISOString(),
        usage_count: 1,
      }, { onConflict: 'user_id,prompt_id' })
    
    if (error) {
      console.error('[v0] Failed to record prompt usage:', error)
      return false
    }
    
    // Also increment the global usage count
    await supabase.rpc('increment_prompt_usage', { prompt_id: promptId })
    
    return true
  } catch (error) {
    console.error('[v0] Error recording prompt usage:', error)
    return false
  }
}

export async function linkPromptToConversation(conversationId: string, promptId: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('conversation_prompts')
      .upsert({
        conversation_id: conversationId,
        prompt_id: promptId,
      }, { onConflict: 'conversation_id' })
    
    if (error) {
      console.error('[v0] Failed to link prompt to conversation:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('[v0] Error linking prompt to conversation:', error)
    return false
  }
}

export async function getConversationPrompt(conversationId: string) {
  try {
    const supabase = await createClient()
    
    const { data: link, error } = await supabase
      .from('conversation_prompts')
      .select('ai_prompts(*)')
      .eq('conversation_id', conversationId)
      .single()
    
    if (error) {
      console.error('[v0] Failed to fetch conversation prompt:', error)
      return null
    }
    
    return link?.ai_prompts || null
  } catch (error) {
    console.error('[v0] Error fetching conversation prompt:', error)
    return null
  }
}

// STRIPE PAYMENT QUERIES

export async function getOrCreateStripeCustomer(userId: string, email: string) {
  try {
    const supabase = await createClient()
    
    // Check if customer exists
    const { data: existingCustomer, error: selectError } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('[v0] Error fetching customer:', selectError)
      return null
    }
    
    if (existingCustomer) {
      return existingCustomer
    }
    
    // Create new customer record
    const { data: newCustomer, error: insertError } = await supabase
      .from('stripe_customers')
      .insert({
        user_id: userId,
        stripe_customer_id: '', // Will be updated when Stripe customer is created
        email: email,
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('[v0] Failed to create customer record:', insertError)
      return null
    }
    
    return newCustomer
  } catch (error) {
    console.error('[v0] Error in getOrCreateStripeCustomer:', error)
    return null
  }
}

export async function updateStripeCustomerId(userId: string, stripeCustomerId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('stripe_customers')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('[v0] Failed to update stripe customer id:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('[v0] Error updating stripe customer id:', error)
    return null
  }
}

export async function getStripeCustomerByUserId(userId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error('[v0] Failed to fetch stripe customer:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('[v0] Error fetching stripe customer:', error)
    return null
  }
}

export async function createStripeSubscription(
  userId: string,
  stripeSubscriptionId: string,
  stripeCustomerId: string,
  stripePriceId: string,
  planName: string,
  planAmount: number,
  planInterval: string,
  monthlyCredits: number
) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('stripe_subscriptions')
      .insert({
        user_id: userId,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        stripe_price_id: stripePriceId,
        status: 'active',
        plan_name: planName,
        plan_amount: planAmount,
        plan_interval: planInterval,
        monthly_credits: monthlyCredits,
      })
      .select()
      .single()
    
    if (error) {
      console.error('[v0] Failed to create subscription:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('[v0] Error creating subscription:', error)
    return null
  }
}

export async function getActiveSubscription(userId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('stripe_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('[v0] Failed to fetch subscription:', error)
      return null
    }
    
    return data || null
  } catch (error) {
    console.error('[v0] Error fetching subscription:', error)
    return null
  }
}

export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string,
  currentPeriodEnd?: Date
) {
  try {
    const supabase = await createClient()
    
    const updateData: any = { status }
    if (currentPeriodEnd) {
      updateData.current_period_end = currentPeriodEnd.toISOString()
    }
    
    const { data, error } = await supabase
      .from('stripe_subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .select()
      .single()
    
    if (error) {
      console.error('[v0] Failed to update subscription status:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('[v0] Error updating subscription status:', error)
    return null
  }
}

export async function getUserSubscriptions(userId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('stripe_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('[v0] Failed to fetch subscriptions:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('[v0] Error fetching subscriptions:', error)
    return []
  }
}

export async function createStripeInvoice(
  userId: string,
  stripeInvoiceId: string,
  amount: number,
  status: string,
  stripeSubscriptionId?: string
) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('stripe_invoices')
      .insert({
        user_id: userId,
        stripe_invoice_id: stripeInvoiceId,
        stripe_subscription_id: stripeSubscriptionId,
        amount,
        status,
      })
      .select()
      .single()
    
    if (error) {
      console.error('[v0] Failed to create invoice:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('[v0] Error creating invoice:', error)
    return null
  }
}

export async function getUserInvoices(userId: string, limit = 50, offset = 0) {
  try {
    const supabase = await createClient()
    
    const { data, error, count } = await supabase
      .from('stripe_invoices')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('[v0] Failed to fetch invoices:', error)
      return { invoices: [], total: 0 }
    }
    
    return { invoices: data || [], total: count || 0 }
  } catch (error) {
    console.error('[v0] Error fetching invoices:', error)
    return { invoices: [], total: 0 }
  }
}
