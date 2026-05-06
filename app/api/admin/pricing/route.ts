import { createClient } from '@/lib/supabase/server'
import { hasAdminPermission, logAdminAction } from '@/lib/admin/auth'
import { getPricingTiers, getPricingTierById, createPricingTier, updatePricingTier } from '@/lib/db/admin-queries'
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
    const hasPermission = await hasAdminPermission(user.id, 'pricing:manage')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const tiers = await getPricingTiers()
    return NextResponse.json(tiers)
  } catch (error) {
    console.error('[v0] Get pricing tiers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Check permission
    const hasPermission = await hasAdminPermission(user.id, 'pricing:manage')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { tierName, priceMonthly, monthlyCredits, features = [] } = body

    if (!tierName || priceMonthly === undefined || !monthlyCredits) {
      return NextResponse.json(
        { error: 'Tier name, price, and credits required' },
        { status: 400 }
      )
    }

    const result = await createPricingTier(
      tierName,
      priceMonthly,
      monthlyCredits,
      features,
      user.id
    )

    if (result) {
      await logAdminAction(
        supabase,
        user.id,
        'create_pricing_tier',
        'pricing_tier',
        result.id,
        { tierName, priceMonthly }
      )
    }

    return NextResponse.json(result || { error: 'Creation failed' })
  } catch (error) {
    console.error('[v0] Create pricing tier error:', error)
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
    const hasPermission = await hasAdminPermission(user.id, 'pricing:manage')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { tierId, updates } = body

    if (!tierId || !updates) {
      return NextResponse.json(
        { error: 'Tier ID and updates required' },
        { status: 400 }
      )
    }

    const result = await updatePricingTier(tierId, updates, user.id)

    if (result) {
      await logAdminAction(
        supabase,
        user.id,
        'update_pricing_tier',
        'pricing_tier',
        tierId,
        updates
      )
    }

    return NextResponse.json(result || { error: 'Update failed' })
  } catch (error) {
    console.error('[v0] Update pricing tier error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
