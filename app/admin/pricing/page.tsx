'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RoleGuard } from '@/components/admin/RoleGuard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2 } from 'lucide-react'

interface PricingTier {
  id: string
  tier_name: string
  price_monthly: number
  monthly_credits: number
  features: string[]
  is_default: boolean
  is_active: boolean
}

export default function AdminPricing() {
  const [tiers, setTiers] = useState<PricingTier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    tierName: '',
    priceMonthly: '',
    monthlyCredits: '',
    features: '',
  })

  useEffect(() => {
    loadTiers()
  }, [])

  async function loadTiers() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/pricing')
      const data = await response.json()
      setTiers(data)
    } catch (error) {
      console.error('[v0] Error loading pricing tiers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function addTier(e: React.FormEvent) {
    e.preventDefault()

    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierName: formData.tierName,
          priceMonthly: parseFloat(formData.priceMonthly),
          monthlyCredits: parseInt(formData.monthlyCredits),
          features: formData.features.split(',').map(f => f.trim()),
        }),
      })

      if (response.ok) {
        setFormData({ tierName: '', priceMonthly: '', monthlyCredits: '', features: '' })
        setShowAddForm(false)
        loadTiers()
      }
    } catch (error) {
      console.error('[v0] Error adding tier:', error)
    }
  }

  return (
    <RoleGuard requiredPermission="pricing:manage">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Pricing & Plans</h1>
              <p className="text-foreground/60 mt-2">Manage subscription tiers and pricing</p>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Plan
            </Button>
          </div>

          {/* Pricing Tiers */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-80 bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : tiers.length === 0 ? (
            <Card className="p-8 text-center text-foreground/60 border border-border">
              No pricing tiers configured yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tiers.map((tier) => (
                <Card key={tier.id} className="p-6 border border-border relative">
                  {tier.is_default && (
                    <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                      Default
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{tier.tier_name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">
                          ${tier.price_monthly}
                        </span>
                        <span className="text-foreground/60">/month</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">
                        {tier.monthly_credits} Credits/month
                      </p>
                      <div className="space-y-1">
                        {tier.features.map((feature, idx) => (
                          <p key={idx} className="text-xs text-foreground/70">
                            • {feature}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border flex gap-2 justify-between">
                      <div className="text-xs text-foreground/60">
                        {tier.is_active ? (
                          <span className="text-green-500">Active</span>
                        ) : (
                          <span className="text-red-500">Inactive</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Add Tier Form */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-96 p-6 border border-border">
                <h2 className="text-lg font-bold text-foreground mb-4">Create New Plan</h2>
                <form onSubmit={addTier} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Plan Name</label>
                    <Input
                      value={formData.tierName}
                      onChange={(e) => setFormData({ ...formData, tierName: e.target.value })}
                      placeholder="e.g., Pro"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Monthly Price ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.priceMonthly}
                      onChange={(e) => setFormData({ ...formData, priceMonthly: e.target.value })}
                      placeholder="9.99"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Monthly Credits</label>
                    <Input
                      type="number"
                      value={formData.monthlyCredits}
                      onChange={(e) => setFormData({ ...formData, monthlyCredits: e.target.value })}
                      placeholder="1000"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Features (comma-separated)</label>
                    <Input
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      placeholder="Feature 1, Feature 2, Feature 3"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      onClick={() => setShowAddForm(false)}
                      variant="outline"
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-primary text-primary-foreground">
                      Create Plan
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      </AdminLayout>
    </RoleGuard>
  )
}
