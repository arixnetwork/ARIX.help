'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RoleGuard } from '@/components/admin/RoleGuard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save } from 'lucide-react'

interface Settings {
  [key: string]: any
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('[v0] Error loading settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function saveSetting(key: string, value: any) {
    try {
      setIsSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })

      if (response.ok) {
        setSettings({
          ...settings,
          [key]: value,
        })
      }
    } catch (error) {
      console.error('[v0] Error saving setting:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const settingGroups = [
    {
      title: 'Website',
      items: [
        { key: 'site_name', label: 'Site Name', type: 'text' },
        { key: 'site_description', label: 'Description', type: 'textarea' },
        { key: 'contact_email', label: 'Contact Email', type: 'email' },
        { key: 'support_email', label: 'Support Email', type: 'email' },
      ],
    },
    {
      title: 'Social Links',
      items: [
        { key: 'twitter_url', label: 'Twitter URL', type: 'url' },
        { key: 'github_url', label: 'GitHub URL', type: 'url' },
        { key: 'linkedin_url', label: 'LinkedIn URL', type: 'url' },
        { key: 'discord_url', label: 'Discord URL', type: 'url' },
      ],
    },
    {
      title: 'Features',
      items: [
        { key: 'enable_registration', label: 'Enable Registration', type: 'checkbox' },
        { key: 'enable_analytics', label: 'Enable Analytics', type: 'checkbox' },
        { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'checkbox' },
      ],
    },
  ]

  return (
    <RoleGuard requiredPermission="settings:edit">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Website Settings</h1>
            <p className="text-foreground/60 mt-2">Manage website configuration and appearance</p>
          </div>

          {isLoading ? (
            <Card className="p-8 text-center text-foreground/60 border border-border">
              Loading settings...
            </Card>
          ) : (
            <div className="space-y-6">
              {settingGroups.map((group) => (
                <Card key={group.title} className="p-6 border border-border">
                  <h2 className="text-lg font-bold text-foreground mb-4">{group.title}</h2>

                  <div className="space-y-4">
                    {group.items.map((item) => (
                      <div key={item.key}>
                        <label className="text-sm font-medium text-foreground block mb-2">
                          {item.label}
                        </label>

                        {item.type === 'textarea' ? (
                          <textarea
                            value={settings[item.key] || ''}
                            onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                            rows={3}
                          />
                        ) : item.type === 'checkbox' ? (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settings[item.key] || false}
                              onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                              className="w-4 h-4 rounded border-input bg-background"
                            />
                            <span className="ml-2 text-sm text-foreground/60">
                              {settings[item.key] ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        ) : (
                          <Input
                            type={item.type}
                            value={settings[item.key] || ''}
                            onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => {
                      // Save all settings in this group
                      group.items.forEach((item) => {
                        saveSetting(item.key, settings[item.key])
                      })
                    }}
                    disabled={isSaving}
                    className="mt-6 bg-primary text-primary-foreground"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </RoleGuard>
  )
}
