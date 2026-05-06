'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RoleGuard } from '@/components/admin/RoleGuard'
import { Card } from '@/components/ui/card'
import { Users, Zap, DollarSign, TrendingUp } from 'lucide-react'

interface AnalyticsOverview {
  total_users: number
  pro_users: number
  free_users: number
  total_tokens_used: number
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    try {
      const response = await fetch('/api/admin/analytics')
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('[v0] Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const stats = [
    {
      label: 'Total Users',
      value: analytics?.total_users || 0,
      icon: Users,
      color: 'bg-blue-500/20 text-blue-500',
    },
    {
      label: 'Pro Users',
      value: analytics?.pro_users || 0,
      icon: TrendingUp,
      color: 'bg-green-500/20 text-green-500',
    },
    {
      label: 'Free Users',
      value: analytics?.free_users || 0,
      icon: Users,
      color: 'bg-orange-500/20 text-orange-500',
    },
    {
      label: 'Tokens Used',
      value: (analytics?.total_tokens_used || 0).toLocaleString(),
      icon: Zap,
      color: 'bg-purple-500/20 text-purple-500',
    },
  ]

  return (
    <RoleGuard>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-foreground/60 mt-2">Welcome to your admin panel</p>
          </div>

          {/* Stats Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="h-28 bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <Card key={stat.label} className="p-6 border border-border hover:border-foreground/20 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-foreground/60 text-sm">{stat.label}</p>
                        <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Quick Links */}
          <Card className="p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                href="/admin/users"
                className="p-4 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors text-foreground font-medium"
              >
                Manage Users
              </a>
              <a
                href="/admin/models"
                className="p-4 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors text-foreground font-medium"
              >
                Configure AI Models
              </a>
              <a
                href="/admin/settings"
                className="p-4 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors text-foreground font-medium"
              >
                Website Settings
              </a>
              <a
                href="/admin/pricing"
                className="p-4 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors text-foreground font-medium"
              >
                Manage Pricing
              </a>
              <a
                href="/admin/analytics"
                className="p-4 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors text-foreground font-medium"
              >
                View Analytics
              </a>
            </div>
          </Card>
        </div>
      </AdminLayout>
    </RoleGuard>
  )
}
