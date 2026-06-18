import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = req.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let query = supabase
      .from('ai_prompts')
      .select('*')
      .eq('is_active', true)

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`
      )
    }

    const { data: prompts, error } = await query.order('name', {
      ascending: true,
    })

    if (error) {
      console.error('[v0] Failed to fetch prompts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch prompts' },
        { status: 500 }
      )
    }

    return NextResponse.json({ prompts: prompts || [] })
  } catch (error) {
    console.error('[v0] Error in prompts API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
