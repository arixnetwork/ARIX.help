import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user profile exists
    const { data: userProfile, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 means no rows returned (which is expected for new users)
      console.error('[v0] Error checking user profile:', selectError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!userProfile) {
      // Create new user profile
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          credits_remaining: 10,
          subscription_tier: 'free',
          tokens_used_today: 0,
        })

      if (insertError) {
        console.error('[v0] Failed to create user profile:', insertError)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }

      console.log('[v0] User profile created:', user.id)
    }

    return NextResponse.json({
      success: true,
      message: 'User profile initialized',
    })
  } catch (error) {
    console.error('[v0] Init API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
