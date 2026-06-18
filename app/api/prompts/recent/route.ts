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

    const { data: recent, error } = await supabase
      .from('user_prompt_preferences')
      .select('ai_prompts(*)')
      .eq('user_id', user.id)
      .not('last_used', 'is', null)
      .order('last_used', { ascending: false })
      .limit(5)

    if (error) {
      console.error('[v0] Failed to fetch recent prompts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recent prompts' },
        { status: 500 }
      )
    }

    const prompts = (recent || [])
      .map((r: any) => r.ai_prompts)
      .filter(Boolean)

    return NextResponse.json({ recent: prompts })
  } catch (error) {
    console.error('[v0] Error in recent prompts API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
