import { createClient } from '@/lib/supabase/server'
import { isAdmin, getUserRole, hasAdminPermission } from '@/lib/admin/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminStatus = await isAdmin(user.id)

    if (!adminStatus) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get user role
    const role = await getUserRole(user.id)

    return NextResponse.json({
      isAdmin: true,
      role,
      userId: user.id,
      email: user.email,
    })
  } catch (error) {
    console.error('[v0] Admin auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
