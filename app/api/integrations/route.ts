import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)

    const projectIds = projects?.map((p) => p.id) || []

    if (projectIds.length === 0) {
      return NextResponse.json([])
    }

    // Get integrations for those projects
    const { data: integrations } = await supabase
      .from('integrations')
      .select('*')
      .in('project_id', projectIds)

    return NextResponse.json(integrations || [])
  } catch (error) {
    console.error('[v0] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { service_name } = body

    if (!service_name) {
      return NextResponse.json(
        { error: 'Missing service_name' },
        { status: 400 }
      )
    }

    // Get user's first project (or create one)
    let { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!project) {
      const { data: newProject } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: 'Main Project',
          slug: `project-${Date.now()}`,
        })
        .select()
        .single()

      project = newProject
    }

    // Create integration connection
    const { data: integration, error } = await supabase
      .from('integrations')
      .insert({
        project_id: project?.id,
        service_name,
        status: 'connected',
        config: { connected_at: new Date().toISOString() },
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create integration' },
        { status: 500 }
      )
    }

    return NextResponse.json(integration)
  } catch (error) {
    console.error('[v0] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
