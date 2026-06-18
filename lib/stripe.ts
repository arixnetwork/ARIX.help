import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

export const PRICING_PLANS = {
  free: {
    name: 'Free',
    description: 'For trying out ARIX',
    monthlyCredits: 10,
    price: 0,
  },
  pro: {
    name: 'Pro',
    description: 'For power users',
    monthlyCredits: 500,
    price: 9900, // $99 in cents
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
  },
  team: {
    name: 'Team',
    description: 'For teams',
    monthlyCredits: 2000,
    price: 29900, // $299 in cents
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEAM,
  },
}

export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: 'auto',
    })

    return session
  } catch (error) {
    console.error('[v0] Error creating checkout session:', error)
    throw error
  }
}

export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return session
  } catch (error) {
    console.error('[v0] Error creating billing portal session:', error)
    throw error
  }
}

export async function getCustomer(customerId: string) {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    return customer
  } catch (error) {
    console.error('[v0] Error fetching customer:', error)
    throw error
  }
}

export async function createCustomer({
  email,
  name,
}: {
  email: string
  name?: string
}) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
    })

    return customer
  } catch (error) {
    console.error('[v0] Error creating customer:', error)
    throw error
  }
}

export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription
  } catch (error) {
    console.error('[v0] Error fetching subscription:', error)
    throw error
  }
}

export async function getInvoice(invoiceId: string) {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId)
    return invoice
  } catch (error) {
    console.error('[v0] Error fetching invoice:', error)
    throw error
  }
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): Stripe.Event | null {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
    return event
  } catch (error) {
    console.error('[v0] Webhook signature verification failed:', error)
    return null
  }
}
