'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Unplug, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react'

const integrations = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send and receive emails',
    icon: '📧',
    category: 'Communication',
    status: 'not_connected',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send messages and notifications',
    icon: '💬',
    category: 'Communication',
    status: 'not_connected',
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Send messages to Discord servers',
    icon: '🎮',
    category: 'Communication',
    status: 'not_connected',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Send WhatsApp messages',
    icon: '📱',
    category: 'Communication',
    status: 'not_connected',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Send Telegram messages',
    icon: '✈️',
    category: 'Communication',
    status: 'not_connected',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Process payments and subscriptions',
    icon: '💳',
    category: 'Payments',
    status: 'not_connected',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Manage your Shopify store',
    icon: '🛒',
    category: 'E-commerce',
    status: 'not_connected',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Save data to Notion databases',
    icon: '📝',
    category: 'Productivity',
    status: 'not_connected',
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    description: 'Create and update spreadsheets',
    icon: '📊',
    category: 'Productivity',
    status: 'not_connected',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect to 5000+ apps',
    icon: '⚡',
    category: 'Automation',
    status: 'not_connected',
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Open-source workflow automation',
    icon: '🔄',
    category: 'Automation',
    status: 'not_connected',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Use GPT models in workflows',
    icon: '🤖',
    category: 'AI',
    status: 'not_connected',
  },
]

const categories = ['All', 'Communication', 'Payments', 'E-commerce', 'Productivity', 'Automation', 'AI']

export default function IntegrationsPage() {
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    // Load connected integrations from user's project
    const loadConnections = async () => {
      try {
        const response = await fetch('/api/integrations')
        if (response.ok) {
          const data = await response.json()
          setConnectedIntegrations(data.map((i: any) => i.service_name))
        }
      } catch (error) {
        console.error('Error loading integrations:', error)
      }
    }

    loadConnections()
  }, [])

  const handleConnect = async (integrationId: string) => {
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_name: integrationId }),
      })

      if (response.ok) {
        setConnectedIntegrations((prev) => [...prev, integrationId])
      }
    } catch (error) {
      console.error('Error connecting integration:', error)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Disconnect this integration?')) return

    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setConnectedIntegrations((prev) => prev.filter((i) => i !== integrationId))
      }
    } catch (error) {
      console.error('Error disconnecting integration:', error)
    }
  }

  const filteredIntegrations =
    selectedCategory === 'All'
      ? integrations
      : integrations.filter((i) => i.category === selectedCategory)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
        <p className="text-foreground/60 mt-1">Connect services to your workflows</p>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-primary text-white'
                : 'bg-background border border-border text-foreground hover:bg-accent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map((integration) => {
          const isConnected = connectedIntegrations.includes(integration.id)

          return (
            <Card key={integration.id} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{integration.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {integration.category}
                      </Badge>
                    </div>
                  </div>
                  {isConnected ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                <CardDescription className="mt-2">{integration.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-600/50"
                    onClick={() => handleDisconnect(integration.id)}
                  >
                    <Unplug className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleConnect(integration.id)}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
