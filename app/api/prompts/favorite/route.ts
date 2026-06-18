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

    const { promptId, isFavorite } = await req.json()

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
          is_favorite: isFavorite,
        },
        { onConflict: 'user_id,prompt_id' }
      )

    if (prefError) {
      console.error('[v0] Failed to update favorite:', prefError)
      return NextResponse.json(
        { error: 'Failed to update favorite' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error in favorite API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
