'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RoleGuard } from '@/components/admin/RoleGuard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Zap, ToggleLeft, ToggleRight } from 'lucide-react'

interface AIModel {
  id: string
  model_name: string
  provider: string
  enabled: boolean
  priority: number
  parameters: any
  created_at: string
}

export default function AdminModels() {
  const [models, setModels] = useState<AIModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    modelName: '',
    provider: 'groq',
    apiKey: '',
  })

  useEffect(() => {
    loadModels()
  }, [])

  async function loadModels() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/models')
      const data = await response.json()
      setModels(data)
    } catch (error) {
      console.error('[v0] Error loading models:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function toggleModel(modelId: string, enabled: boolean) {
    try {
      await fetch('/api/admin/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          enabled: !enabled,
        }),
      })
      loadModels()
    } catch (error) {
      console.error('[v0] Error toggling model:', error)
    }
  }

  async function addModel(e: React.FormEvent) {
    e.preventDefault()

    try {
      const response = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({ modelName: '', provider: 'groq', apiKey: '' })
        setShowAddForm(false)
        loadModels()
      }
    } catch (error) {
      console.error('[v0] Error adding model:', error)
    }
  }

  const providers = ['groq', 'openai', 'anthropic', 'google', 'grok', 'deepinfra']

  return (
    <RoleGuard requiredPermission="models:view">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI Model Configuration</h1>
              <p className="text-foreground/60 mt-2">Manage and configure AI models</p>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Model
            </Button>
          </div>

          {/* Models Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="h-40 bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : models.length === 0 ? (
            <Card className="p-8 text-center text-foreground/60 border border-border">
              No AI models configured yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((model) => (
                <Card key={model.id} className="p-6 border border-border">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-foreground">{model.model_name}</h3>
                          <p className="text-xs text-foreground/60 capitalize">{model.provider}</p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            model.enabled
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {model.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="space-y-1">
                        <p className="text-xs text-foreground/60">Priority</p>
                        <p className="font-semibold text-foreground">{model.priority}</p>
                      </div>
                      <Button
                        onClick={() => toggleModel(model.id, model.enabled)}
                        variant="outline"
                        size="sm"
                      >
                        {model.enabled ? (
                          <>
                            <ToggleRight className="w-4 h-4 mr-1 text-green-500" />
                            Disable
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 mr-1" />
                            Enable
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Add Model Form */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-96 p-6 border border-border">
                <h2 className="text-lg font-bold text-foreground mb-4">Add AI Model</h2>
                <form onSubmit={addModel} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Model Name</label>
                    <Input
                      value={formData.modelName}
                      onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                      placeholder="e.g., GPT-4"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Provider</label>
                    <select
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                    >
                      {providers.map((p) => (
                        <option key={p} value={p} className="bg-background text-foreground">
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">API Key</label>
                    <Input
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      placeholder="Enter API key (secured)"
                      required
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
                      Add Model
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
