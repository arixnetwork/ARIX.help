import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/stripe'
import {
  updateSubscriptionStatus,
  createStripeInvoice,
  updateUserSubscription,
} from '@/lib/db/queries'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('[v0] Missing stripe signature')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature)

    if (!event) {
      console.error('[v0] Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log(`[v0] Processing webhook event: ${event.type}`)

    const supabase = await createClient()

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('[v0] Checkout completed:', session.id)
        
        // Get subscription details
        if (session.subscription) {
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string
          
          // You can fetch more details if needed
          console.log('[v0] Subscription created:', subscriptionId)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`[v0] Subscription ${event.type}:`, subscription.id)

        // Get user from Stripe metadata or lookup by customer
        const { data: customer } = await supabase
          .from('stripe_customers')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (customer) {
          const status = subscription.status as string
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

          // Update subscription in database
          await updateSubscriptionStatus(subscription.id, status, currentPeriodEnd)

          // Update user's subscription tier if active
          if (status === 'active') {
            await updateUserSubscription(customer.user_id, 'pro')
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('[v0] Subscription deleted:', subscription.id)

        // Get user from Stripe metadata
        const { data: customer } = await supabase
          .from('stripe_customers')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (customer) {
          // Revert to free tier
          await updateUserSubscription(customer.user_id, 'free')

          // Update subscription status
          await updateSubscriptionStatus(subscription.id, 'canceled')
        }
        break
      }

      case 'invoice.created':
      case 'invoice.updated': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`[v0] Invoice ${event.type}:`, invoice.id)

        // Get user from customer
        const { data: customer } = await supabase
          .from('stripe_customers')
          .select('user_id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (customer && invoice.amount_paid) {
          // Create or update invoice in database
          await createStripeInvoice(
            customer.user_id,
            invoice.id,
            invoice.amount_paid,
            invoice.status || 'draft',
            (invoice.subscription as string) || undefined
          )
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('[v0] Invoice paid:', invoice.id)

        // Get user from customer
        const { data: customer } = await supabase
          .from('stripe_customers')
          .select('user_id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (customer) {
          // Update invoice status
          const { error } = await supabase
            .from('stripe_invoices')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
            })
            .eq('stripe_invoice_id', invoice.id)

          if (error) {
            console.error('[v0] Failed to update invoice:', error)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('[v0] Invoice payment failed:', invoice.id)
        // You could send an email notification here
        break
      }

      default:
        console.log(`[v0] Unhandled webhook event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[v0] Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
