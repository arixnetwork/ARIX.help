'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderOpen,
  Code2,
  Zap,
  Settings,
  Users,
  LogOut,
  Globe,
  Smartphone,
  Package,
  Palette,
  Workflow,
  MessageCircle,
  Bot,
  Plug,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const navigationItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/dashboard/projects', icon: FolderOpen },
  { divider: true },
  { label: 'AI Builders', group: true },
  { label: 'Website Builder', href: '/dashboard/builders/website', icon: Globe },
  { label: 'App Builder', href: '/dashboard/builders/app', icon: Smartphone },
  { label: 'SaaS Builder', href: '/dashboard/builders/saas', icon: Package },
  { label: 'UI Components', href: '/dashboard/builders/ui', icon: Palette },
  { label: 'Code Snippets', href: '/dashboard/builders/coding', icon: Code2 },
  { label: 'SEO Optimizer', href: '/dashboard/builders/seo', icon: Zap },
  { label: 'AI Agent Builder', href: '/dashboard/builders/agent', icon: Bot },
  { label: 'Chatbot Builder', href: '/dashboard/builders/chatbot', icon: MessageCircle },
  { divider: true },
  { label: 'Workflows', href: '/dashboard/workflows', icon: Workflow },
  { label: 'Integrations', href: '/dashboard/integrations', icon: Plug },
  { divider: true },
  { label: 'Team', href: '/dashboard/team', icon: Users },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-bold text-foreground">Arix</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigationItems.map((item, idx) => {
          if (item.divider) {
            return <div key={idx} className="my-2 border-t border-border" />
          }

          if (item.group) {
            return (
              <div key={idx} className="px-2 py-2 mt-2">
                <span className="text-xs font-semibold text-foreground/50 uppercase">{item.label}</span>
              </div>
            )
          }

          const Icon = item.icon as any
          const isActive = pathname === item.href

          return (
            <Link key={idx} href={item.href as string}>
              <button
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
          disabled={isLoading}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isLoading ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
    </aside>
  )
}
