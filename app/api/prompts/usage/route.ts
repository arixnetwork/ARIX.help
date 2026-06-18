import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { promptId } = await req.json()

    if (!promptId) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      )
    }

    // Upsert user prompt preference
    const { error: prefError } = await supabase
      .from('user_prompt_preferences')
      .upsert(
        {
          user_id: user.id,
          prompt_id: promptId,
          last_used: new Date().toISOString(),
        },
        { onConflict: 'user_id,prompt_id' }
      )

    if (prefError) {
      console.error('[v0] Failed to update user preference:', prefError)
      return NextResponse.json(
        { error: 'Failed to record usage' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error in usage API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
