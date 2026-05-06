import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: preferences, error } = await supabase
      .from('chat_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 })
    }

    // Return defaults if not found
    if (!preferences) {
      return NextResponse.json({
        theme: 'dark',
        default_model: 'mixtral-8x7b-32768',
        temperature: 0.7,
        max_tokens: 2048,
        font_size: 'medium',
        message_density: 'comfortable',
        show_token_count: true,
        auto_save_drafts: true,
        enable_notifications: true,
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('[v0] Preferences API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const preferences = await request.json()

    const { data, error } = await supabase
      .from('chat_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Preferences update error:', error)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Preferences API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
