import { createClient } from '@/lib/supabase/server'
import { hasAdminPermission } from '@/lib/admin/auth'
import { getAnalyticsOverview } from '@/lib/db/admin-queries'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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
    const hasPermission = await hasAdminPermission(user.id, 'analytics:view')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const overview = await getAnalyticsOverview()

    return NextResponse.json(overview)
  } catch (error) {
    console.error('[v0] Get analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
