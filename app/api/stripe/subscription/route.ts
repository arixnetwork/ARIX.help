import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveSubscription, getUserInvoices } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get active subscription
    const subscription = await getActiveSubscription(user.id)

    // Get recent invoices
    const { invoices, total: invoicesCount } = await getUserInvoices(user.id, 10, 0)

    return NextResponse.json({
      subscription,
      invoices,
      invoicesCount,
    })
  } catch (error) {
    console.error('[v0] Subscription status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
