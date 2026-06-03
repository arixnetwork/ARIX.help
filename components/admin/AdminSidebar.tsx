'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Users,
  Zap,
  Settings,
  DollarSign,
  BarChart3,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AdminRole } from '@/lib/admin/roles'
import { canManageUsers, canManageModels, canManageSettings, canManagePricing, canViewAnalytics } from '@/lib/admin/roles'

interface AdminUser {
  isAdmin: boolean
  role: AdminRole
  userId: string
  email: string
}

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isOpen, setIsOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAdminStatus()
  }, [])

  async function checkAdminStatus() {
    try {
      const response = await fetch('/api/admin/auth/check-role', {
        method: 'POST',
      })

      if (!response.ok) {
        router.push('/auth/login')
        return
      }

      const data = await response.json()
      setAdminUser(data)
    } catch (error) {
      console.error('[v0] Error checking admin status:', error)
      router.push('/auth/login')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-64 bg-card border-r border-border flex items-center justify-center">
        <div className="text-foreground/60">Loading...</div>
      </div>
    )
  }

  if (!adminUser) {
    return null
  }

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: 'Users',
      href: '/admin/users',
      icon: Users,
      visible: canManageUsers(adminUser.role),
    },
    {
      label: 'AI Models',
      href: '/admin/models',
      icon: Zap,
      visible: canManageModels(adminUser.role),
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      visible: canManageSettings(adminUser.role),
    },
    {
      label: 'Pricing',
      href: '/admin/pricing',
      icon: DollarSign,
      visible: canManagePricing(adminUser.role),
    },
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      visible: canViewAnalytics(adminUser.role),
    },
  ].filter(item => item.visible)

  return (
    <>
      {/* Mobile toggle */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'w-64' : 'w-0'
        } bg-card border-r border-border transition-all duration-300 overflow-hidden flex flex-col fixed md:relative h-full z-40`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">ARIX Admin</h1>
          <p className="text-xs text-foreground/60 mt-1">Role: {adminUser.role}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/70 hover:bg-foreground/10'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <div className="px-4 py-2">
            <p className="text-xs text-foreground/60">Logged in as:</p>
            <p className="text-sm font-medium text-foreground truncate">{adminUser.email}</p>
          </div>
          <Button
            onClick={() => {
              // Logout logic
              window.location.href = '/auth/logout'
            }}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
