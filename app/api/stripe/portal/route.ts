import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripeCustomerByUserId } from '@/lib/db/queries'
import { createBillingPortalSession } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get Stripe customer
    const stripeCustomer = await getStripeCustomerByUserId(user.id)

    if (!stripeCustomer || !stripeCustomer.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      )
    }

    // Get the origin for redirect URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const returnUrl = `${origin}/billing`

    // Create billing portal session
    try {
      const session = await createBillingPortalSession({
        customerId: stripeCustomer.stripe_customer_id,
        returnUrl,
      })

      return NextResponse.json({ url: session.url })
    } catch (error) {
      console.error('[v0] Failed to create billing portal session:', error)
      return NextResponse.json(
        { error: 'Failed to create billing portal session' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[v0] Billing portal API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
