import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getOrCreateStripeCustomer,
  updateStripeCustomerId,
} from '@/lib/db/queries'
import { createCheckoutSession, createCustomer } from '@/lib/stripe'

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

    const body = await request.json()
    const { priceId, planName } = body

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    let stripeCustomer = await getOrCreateStripeCustomer(user.id, user.email || '')

    if (!stripeCustomer || !stripeCustomer.stripe_customer_id) {
      // Create Stripe customer
      try {
        const newCustomer = await createCustomer({
          email: user.email || '',
          name: user.user_metadata?.name || undefined,
        })

        // Update database with Stripe customer ID
        await updateStripeCustomerId(user.id, newCustomer.id)
        stripeCustomer = {
          ...stripeCustomer,
          stripe_customer_id: newCustomer.id,
        }
      } catch (error) {
        console.error('[v0] Failed to create Stripe customer:', error)
        return NextResponse.json(
          { error: 'Failed to create customer' },
          { status: 500 }
        )
      }
    }

    // Get the origin for redirect URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = `${origin}/billing?success=true`
    const cancelUrl = `${origin}/billing?canceled=true`

    // Create checkout session
    try {
      const session = await createCheckoutSession({
        customerId: stripeCustomer.stripe_customer_id,
        priceId,
        successUrl,
        cancelUrl,
      })

      return NextResponse.json({ 
        sessionId: session.id,
        url: session.url,
      })
    } catch (error) {
      console.error('[v0] Failed to create checkout session:', error)
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[v0] Checkout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
