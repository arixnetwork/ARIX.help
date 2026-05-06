import { createClient } from '@/lib/supabase/server'
import { hasAdminPermission, logAdminAction } from '@/lib/admin/auth'
import { getWebsiteSettings, updateWebsiteSetting } from '@/lib/db/admin-queries'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const settings = await getWebsiteSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('[v0] Get settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await hasAdminPermission(user.id, 'settings:edit')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value required' },
        { status: 400 }
      )
    }

    const result = await updateWebsiteSetting(key, value, user.id)

    if (result) {
      await logAdminAction(
        supabase,
        user.id,
        'update_setting',
        'website_setting',
        key,
        { value }
      )
    }

    return NextResponse.json(result || { error: 'Update failed' })
  } catch (error) {
    console.error('[v0] Update settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
