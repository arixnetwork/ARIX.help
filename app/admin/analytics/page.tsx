'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RoleGuard } from '@/components/admin/RoleGuard'
import { Card } from '@/components/ui/card'
import { Users, TrendingUp, Zap, BarChart3, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Analytics {
  total_users: number
  pro_users: number
  free_users: number
  total_tokens_used: number
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
    const interval = setInterval(loadAnalytics, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
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
      change: '+12%',
    },
    {
      label: 'Pro Subscribers',
      value: analytics?.pro_users || 0,
      icon: TrendingUp,
      color: 'bg-green-500/20 text-green-500',
      change: '+5%',
    },
    {
      label: 'Free Users',
      value: analytics?.free_users || 0,
      icon: Users,
      color: 'bg-orange-500/20 text-orange-500',
      change: '+8%',
    },
    {
      label: 'Tokens Used',
      value: (analytics?.total_tokens_used || 0).toLocaleString(),
      icon: Zap,
      color: 'bg-purple-500/20 text-purple-500',
      change: '+24%',
    },
  ]

  return (
    <RoleGuard requiredPermission="analytics:view">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-foreground/60 mt-2">Real-time statistics and insights</p>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Stats Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="h-32 bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <Card key={stat.label} className="p-6 border border-border hover:border-foreground/20 transition-colors">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-foreground/60 text-sm">{stat.label}</p>
                          <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                        </div>
                        <div className={`p-2.5 rounded-lg ${stat.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                      <p className="text-xs text-green-500">{stat.change} from last month</p>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                User Growth
              </h2>
              <div className="h-64 bg-foreground/5 rounded-lg flex items-center justify-center">
                <p className="text-foreground/40">Chart will render here</p>
              </div>
            </Card>

            <Card className="p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Token Usage
              </h2>
              <div className="h-64 bg-foreground/5 rounded-lg flex items-center justify-center">
                <p className="text-foreground/40">Chart will render here</p>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">User activity {i}</p>
                    <p className="text-xs text-foreground/60">2 minutes ago</p>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-500">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </AdminLayout>
    </RoleGuard>
  )
}
