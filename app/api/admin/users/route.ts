import { createClient } from '@/lib/supabase/server'
import { hasAdminPermission, logAdminAction } from '@/lib/admin/auth'
import { getUsers, searchUsers, updateUserCredits, updateUserSubscription } from '@/lib/db/admin-queries'
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
    const hasPermission = await hasAdminPermission(user.id, 'users:view')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let result
    if (search) {
      const users = await searchUsers(search, limit)
      result = { users, total: users.length }
    } else {
      result = await getUsers(limit, offset)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[v0] Get users error:', error)
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
    const hasPermission = await hasAdminPermission(user.id, 'users:edit')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, credits, subscription_tier } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    let result
    const changes: any = {}

    if (credits !== undefined) {
      result = await updateUserCredits(userId, credits)
      changes.credits = credits
    }

    if (subscription_tier !== undefined) {
      result = await updateUserSubscription(userId, subscription_tier)
      changes.subscription_tier = subscription_tier
    }

    if (result) {
      await logAdminAction(
        supabase,
        user.id,
        'update_user',
        'user',
        userId,
        changes
      )
    }

    return NextResponse.json(result || { error: 'Update failed' })
  } catch (error) {
    console.error('[v0] Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
