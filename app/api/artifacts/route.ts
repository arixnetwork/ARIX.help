import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      builder_type,
      title,
      description,
      project_id,
      template,
      framework,
      content,
    } = body

    if (!builder_type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate builder type
    const validBuilderTypes = ['website', 'app', 'saas', 'ui', 'coding', 'seo', 'agent', 'chatbot', 'workflow']
    if (!validBuilderTypes.includes(builder_type)) {
      return NextResponse.json(
        { error: 'Invalid builder type' },
        { status: 400 }
      )
    }

    // Get or create project
    let projectIdToUse = project_id

    if (!projectIdToUse) {
      // Create a default project if not provided
      const { data: project } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: `${title} Project`,
          slug: `project-${Date.now()}`,
        })
        .select()
        .single()

      projectIdToUse = project?.id
    }

    // Create artifact
    const { data: artifact, error } = await supabase
      .from('artifacts')
      .insert({
        project_id: projectIdToUse,
        builder_type,
        title,
        description,
        status: 'draft',
        metadata: {
          template,
          framework,
          created_by: user.id,
          created_at: new Date().toISOString(),
        },
        content: content || {
          template,
          framework,
          sections: [],
        },
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating artifact:', error)
      return NextResponse.json(
        { error: 'Failed to create artifact' },
        { status: 500 }
      )
    }

    // Create builder-specific record based on type
    if (builder_type === 'website' && artifact) {
      await supabase.from('websites').insert({
        artifact_id: artifact.id,
        template_used: template,
        pages: { home: { title, sections: [] } },
        global_styles: {},
        seo_config: { title, description },
      })
    }

    if (builder_type === 'app' && artifact) {
      await supabase.from('apps').insert({
        artifact_id: artifact.id,
        framework,
        screens: [],
        navigation_config: {},
        state_management: {},
        build_status: 'pending',
      })
    }

    return NextResponse.json(artifact)
  } catch (error) {
    console.error('[v0] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')
    const builderType = searchParams.get('builder_type')

    let query = supabase
      .from('artifacts')
      .select('*')
      .in('project_id', [
        ...(projectId ? [projectId] : []),
      ])

    if (builderType) {
      query = query.eq('builder_type', builderType)
    }

    const { data: artifacts, error } = await query.order('created_at', {
      ascending: false,
    })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch artifacts' }, { status: 500 })
    }

    return NextResponse.json(artifacts || [])
  } catch (error) {
    console.error('[v0] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
