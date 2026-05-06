'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { AdminRole } from '@/lib/admin/roles'

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole?: AdminRole | AdminRole[]
  requiredPermission?: string
}

export function RoleGuard({
  children,
  requiredRole,
  requiredPermission,
}: RoleGuardProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthorization()
  }, [requiredRole, requiredPermission])

  async function checkAuthorization() {
    try {
      const response = await fetch('/api/admin/auth/check-role', {
        method: 'POST',
      })

      if (!response.ok) {
        router.push('/auth/login')
        return
      }

      const data = await response.json()

      // Check role requirement
      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
        if (!roles.includes(data.role)) {
          router.push('/admin')
          return
        }
      }

      setIsAuthorized(true)
    } catch (error) {
      console.error('[v0] Authorization check failed:', error)
      router.push('/auth/login')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-foreground/60">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-foreground/60">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
