import { createClient } from '@/lib/supabase/server'

// User Management Queries

export async function getUsers(limit = 50, offset = 0) {
  const supabase = await createClient()

  const { data, error, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[v0] Error fetching users:', error)
    return { users: [], total: 0 }
  }

  return { users: data || [], total: count || 0 }
}

export async function searchUsers(query: string, limit = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`email.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[v0] Error searching users:', error)
    return []
  }

  return data || []
}

export async function getUserById(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('[v0] Error fetching user:', error)
    return null
  }

  return data
}

export async function updateUserCredits(userId: string, credits: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .update({ credits_remaining: credits })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error updating user credits:', error)
    return null
  }

  return data
}

export async function updateUserSubscription(
  userId: string,
  tier: 'free' | 'pro'
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .update({ subscription_tier: tier })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error updating subscription:', error)
    return null
  }

  return data
}

// Website Settings Queries

export async function getWebsiteSettings() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('website_settings')
    .select('*')

  if (error) {
    console.error('[v0] Error fetching settings:', error)
    return {}
  }

  const settings: Record<string, any> = {}
  data?.forEach((setting) => {
    settings[setting.key] = setting.value
  })

  return settings
}

export async function updateWebsiteSetting(key: string, value: any, userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('website_settings')
    .upsert({
      key,
      value,
      updated_by: userId,
      last_updated: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[v0] Error updating setting:', error)
    return null
  }

  return data
}

// AI Model Queries

export async function getAIModels() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_model_configs')
    .select('*')
    .order('priority', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching models:', error)
    return []
  }

  return data || []
}

export async function getAIModelById(modelId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_model_configs')
    .select('*')
    .eq('id', modelId)
    .single()

  if (error) {
    console.error('[v0] Error fetching model:', error)
    return null
  }

  return data
}

export async function createAIModel(
  modelName: string,
  provider: string,
  apiKeyHash: string,
  parameters: any,
  userId: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_model_configs')
    .insert({
      model_name: modelName,
      provider,
      api_key_hash: apiKeyHash,
      parameters,
      updated_by: userId,
    })
    .select()
    .single()

  if (error) {
    console.error('[v0] Error creating model:', error)
    return null
  }

  return data
}

export async function updateAIModel(
  modelId: string,
  updates: any,
  userId: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_model_configs')
    .update({
      ...updates,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', modelId)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error updating model:', error)
    return null
  }

  return data
}

export async function toggleAIModelStatus(modelId: string, enabled: boolean, userId: string) {
  return updateAIModel(modelId, { enabled }, userId)
}

// Pricing Tiers Queries

export async function getPricingTiers() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pricing_tiers')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('[v0] Error fetching pricing tiers:', error)
    return []
  }

  return data || []
}

export async function getPricingTierById(tierId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pricing_tiers')
    .select('*')
    .eq('id', tierId)
    .single()

  if (error) {
    console.error('[v0] Error fetching tier:', error)
    return null
  }

  return data
}

export async function createPricingTier(
  tierName: string,
  priceMonthly: number,
  monthlyCredits: number,
  features: string[],
  userId: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pricing_tiers')
    .insert({
      tier_name: tierName,
      price_monthly: priceMonthly,
      monthly_credits: monthlyCredits,
      features,
      updated_by: userId,
    })
    .select()
    .single()

  if (error) {
    console.error('[v0] Error creating tier:', error)
    return null
  }

  return data
}

export async function updatePricingTier(
  tierId: string,
  updates: any,
  userId: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pricing_tiers')
    .update({
      ...updates,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tierId)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error updating tier:', error)
    return null
  }

  return data
}

// Analytics Queries

export async function getAnalyticsOverview() {
  const supabase = await createClient()

  try {
    const { data: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact' })

    const { data: proUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .eq('subscription_tier', 'pro')

    const { data: totalUsage } = await supabase
      .from('usage_tracking')
      .select('tokens_used')

    const totalTokens = (totalUsage || []).reduce((sum, row) => sum + (row.tokens_used || 0), 0)

    return {
      total_users: totalUsers?.length || 0,
      pro_users: proUsers?.length || 0,
      free_users: (totalUsers?.length || 0) - (proUsers?.length || 0),
      total_tokens_used: totalTokens,
    }
  } catch (error) {
    console.error('[v0] Error fetching analytics:', error)
    return {
      total_users: 0,
      pro_users: 0,
      free_users: 0,
      total_tokens_used: 0,
    }
  }
}

export async function getUserGrowthData(days = 30) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('get_user_growth', { days_back: days })

  if (error) {
    console.error('[v0] Error fetching user growth:', error)
    return []
  }

  return data || []
}

// Admin Logs Queries

export async function getAdminLogs(limit = 50, offset = 0) {
  const supabase = await createClient()

  const { data, error, count } = await supabase
    .from('admin_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[v0] Error fetching admin logs:', error)
    return { logs: [], total: 0 }
  }

  return { logs: data || [], total: count || 0 }
}
