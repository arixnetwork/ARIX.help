'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RoleGuard } from '@/components/admin/RoleGuard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Edit2, Shield } from 'lucide-react'

interface User {
  id: string
  email: string
  subscription_tier: string
  credits_remaining: number
  created_at: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newCredits, setNewCredits] = useState<string>('')

  useEffect(() => {
    loadUsers()
  }, [search])

  async function loadUsers() {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('[v0] Error loading users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function updateUserCredits() {
    if (!editingUser || !newCredits) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          credits: parseInt(newCredits),
        }),
      })

      if (response.ok) {
        loadUsers()
        setEditingUser(null)
        setNewCredits('')
      }
    } catch (error) {
      console.error('[v0] Error updating user:', error)
    }
  }

  async function upgradeUserToPro(userId: string) {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscription_tier: 'pro',
        }),
      })

      if (response.ok) {
        loadUsers()
      }
    } catch (error) {
      console.error('[v0] Error upgrading user:', error)
    }
  }

  return (
    <RoleGuard requiredPermission="users:view">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-foreground/60 mt-2">Manage user accounts and subscriptions</p>
          </div>

          {/* Search */}
          <Card className="p-4 border border-border">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-foreground/50" />
              <Input
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
            </div>
          </Card>

          {/* Users Table */}
          <Card className="border border-border overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-foreground/60">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-foreground/60">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-foreground/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Tier</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Credits</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Joined</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-foreground/5 transition-colors">
                        <td className="px-6 py-4 text-sm text-foreground">{user.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.subscription_tier === 'pro'
                                ? 'bg-purple-500/20 text-purple-500'
                                : 'bg-blue-500/20 text-blue-500'
                            }`}
                          >
                            {user.subscription_tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{user.credits_remaining}</td>
                        <td className="px-6 py-4 text-sm text-foreground/60">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <Button
                            onClick={() => {
                              setEditingUser(user)
                              setNewCredits(user.credits_remaining.toString())
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          {user.subscription_tier === 'free' && (
                            <Button
                              onClick={() => upgradeUserToPro(user.id)}
                              variant="outline"
                              size="sm"
                              className="text-purple-500 border-purple-500/50"
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              Upgrade
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Edit Dialog */}
          {editingUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-96 p-6 border border-border">
                <h2 className="text-lg font-bold text-foreground mb-4">Edit User Credits</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <p className="text-foreground/60">{editingUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Credits</label>
                    <Input
                      type="number"
                      value={newCredits}
                      onChange={(e) => setNewCredits(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      onClick={() => setEditingUser(null)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={updateUserCredits}
                      className="bg-primary text-primary-foreground"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </AdminLayout>
    </RoleGuard>
  )
}
