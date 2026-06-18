import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: favorites, error } = await supabase
      .from('user_prompt_preferences')
      .select('ai_prompts(*)')
      .eq('user_id', user.id)
      .eq('is_favorite', true)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[v0] Failed to fetch favorites:', error)
      return NextResponse.json(
        { error: 'Failed to fetch favorites' },
        { status: 500 }
      )
    }

    const prompts = (favorites || [])
      .map((f: any) => f.ai_prompts)
      .filter(Boolean)

    return NextResponse.json({ favorites: prompts })
  } catch (error) {
    console.error('[v0] Error in favorites API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
