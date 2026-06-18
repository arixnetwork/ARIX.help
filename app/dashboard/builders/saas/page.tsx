'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Zap } from 'lucide-react'

const saasFeatures = [
  { id: 'auth', name: 'Authentication', icon: '🔐' },
  { id: 'payment', name: 'Payment Processing', icon: '💳' },
  { id: 'dashboard', name: 'User Dashboard', icon: '📊' },
  { id: 'database', name: 'Database Setup', icon: '🗄️' },
  { id: 'api', name: 'REST API', icon: '🔌' },
  { id: 'analytics', name: 'Analytics', icon: '📈' },
]

export default function SaaSBuilder() {
  const [productName, setProductName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  const handleCreateSaaS = async () => {
    if (!productName) return

    try {
      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builder_type: 'saas',
          title: productName,
          description,
          features: selectedFeatures,
        }),
      })

      if (response.ok) {
        const artifact = await response.json()
        window.location.href = `/dashboard/builders/saas/${artifact.id}`
      }
    } catch (error) {
      console.error('Error creating SaaS:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">SaaS Builder</h1>
          <p className="text-foreground/60">Launch your SaaS product with AI</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Create Your SaaS</CardTitle>
            <CardDescription>Define your product and features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Product Name
              </label>
              <Input
                placeholder="e.g., TaskFlow"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <Textarea
                placeholder="Describe your SaaS product..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background border-border"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Select Features
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {saasFeatures.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() =>
                      setSelectedFeatures((prev) =>
                        prev.includes(feature.id)
                          ? prev.filter((f) => f !== feature.id)
                          : [...prev, feature.id]
                      )
                    }
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      selectedFeatures.includes(feature.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{feature.icon}</div>
                    <div className="text-sm font-medium text-foreground">{feature.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleCreateSaaS} className="w-full gap-2" disabled={!productName}>
              <Zap className="w-4 h-4" />
              Generate SaaS
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
