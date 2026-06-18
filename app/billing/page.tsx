'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Check, Zap, CreditCard, Download, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'

interface Subscription {
  id: string
  plan_name: string
  status: string
  current_period_end: string
  monthly_credits: number
  plan_amount: number
}

interface Invoice {
  id: string
  stripe_invoice_id: string
  amount: number
  status: string
  created_at: string
  invoice_pdf_url?: string
}

const PRICING_PLANS = [
  {
    name: 'Free',
    description: 'For trying out ARIX',
    credits: '10 per day',
    price: '$0',
    features: [
      '10 daily credits',
      'Basic AI prompts (5)',
      'Community support',
      'Standard rate limits',
    ],
  },
  {
    name: 'Pro',
    description: 'For power users',
    credits: '500 per month',
    price: '$99',
    period: '/month',
    features: [
      '500 monthly credits',
      'All 18 AI prompts',
      'Priority support',
      'Unlimited conversations',
      'API access',
      'Advanced analytics',
    ],
    highlighted: true,
  },
  {
    name: 'Team',
    description: 'For teams',
    credits: '2,000 per month',
    price: '$299',
    period: '/month',
    features: [
      '2,000 monthly credits',
      'All 18 AI prompts',
      'Priority support',
      'Team management',
      'Advanced API access',
      'Custom integration',
      'Dedicated account manager',
    ],
    highlighted: false,
  },
]

export default function BillingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile)
      }

      // Get subscription and invoices
      const response = await fetch('/api/stripe/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('[v0] Error loading billing data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async (planName: string) => {
    if (planName === 'Free') return

    setIsCheckingOut(true)
    try {
      let priceId = ''
      if (planName === 'Pro') {
        priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || ''
      } else if (planName === 'Team') {
        priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEAM || ''
      }

      if (!priceId) {
        toast({
          title: 'Error',
          description: 'Price configuration missing. Please contact support.',
          variant: 'destructive',
        })
        setIsCheckingOut(false)
        return
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, planName }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('[v0] Error during checkout:', error)
      toast({
        title: 'Error',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      })
      setIsCheckingOut(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to open billing portal')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('[v0] Error opening billing portal:', error)
      toast({
        title: 'Error',
        description: 'Failed to open billing portal. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-foreground/60 text-sm">Loading billing information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
          <p className="text-foreground/60 mt-2">Manage your plan and view your invoices</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Credits Info */}
        {userProfile && (
          <div className="mb-8">
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Your Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <p className="text-sm text-foreground/60 mb-1">Current Plan</p>
                    <p className="text-2xl font-bold text-foreground capitalize">
                      {userProfile.subscription_tier}
                    </p>
                  </div>
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <p className="text-sm text-foreground/60 mb-1">Credits Remaining</p>
                    <p className="text-2xl font-bold text-primary">
                      {userProfile.credits_remaining}
                    </p>
                  </div>
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <p className="text-sm text-foreground/60 mb-1">Reset Time</p>
                    <p className="text-sm text-foreground">
                      {userProfile.subscription_tier === 'free'
                        ? 'Daily at 00:00 UTC'
                        : 'Monthly with billing cycle'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Upgrade Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING_PLANS.map((plan, idx) => (
              <Card
                key={idx}
                className={`relative flex flex-col ${
                  plan.highlighted ? 'border-primary border-2' : ''
                }`}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 right-4 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-foreground">
                      {plan.price}
                      {plan.period && (
                        <span className="text-lg font-normal text-foreground/60">
                          {plan.period}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-primary font-semibold mt-2">{plan.credits}</p>
                  </div>

                  <div className="flex-1">
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {userProfile?.subscription_tier === plan.name.toLowerCase() ? (
                    <Button disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={isCheckingOut}
                      className="w-full"
                      variant={plan.highlighted ? 'default' : 'outline'}
                    >
                      {plan.name === 'Free' ? 'Downgrade' : 'Upgrade'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Subscription Details */}
        {subscription && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Active Subscription</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Subscription Details</span>
                  <Badge
                    variant={
                      subscription.status === 'active' ? 'default' : 'secondary'
                    }
                  >
                    {subscription.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-foreground/60">Plan</p>
                    <p className="font-semibold text-foreground capitalize">
                      {subscription.plan_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60">Monthly Credits</p>
                    <p className="font-semibold text-foreground">
                      {subscription.monthly_credits}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60">Price</p>
                    <p className="font-semibold text-foreground">
                      ${(subscription.plan_amount / 100).toFixed(2)}/month
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60">Renews</p>
                    <p className="font-semibold text-foreground">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button onClick={handleManageBilling} className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Subscription & Payment Methods
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Invoices */}
        {invoices.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Invoices</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-card/50 transition"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">
                          Invoice {invoice.stripe_invoice_id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-sm text-foreground/60">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          ${(invoice.amount / 100).toFixed(2)}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 p-6 rounded-lg border border-border bg-card">
          <div className="flex gap-4">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Need Help?</h3>
              <p className="text-sm text-foreground/60">
                If you have questions about your billing or need to make changes, please{' '}
                <Link href="/contact" className="text-primary hover:underline">
                  contact our support team
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  )
}
