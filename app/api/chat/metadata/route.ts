import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const conversationId = request.nextUrl.searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    const { data: metadata, error } = await supabase
      .from('conversation_metadata')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to load metadata' }, { status: 500 })
    }

    return NextResponse.json(metadata || null)
  } catch (error) {
    console.error('[v0] Metadata API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { conversationId, ...metadata } = await request.json()

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('conversation_metadata')
      .upsert({
        conversation_id: conversationId,
        user_id: user.id,
        ...metadata,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Metadata update error:', error)
      return NextResponse.json({ error: 'Failed to update metadata' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Metadata API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
