'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Zap } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const uiComponentTypes = ['Button', 'Form', 'Modal', 'Card', 'Navbar', 'Footer', 'Hero', 'Testimonials']
const frameworks = ['Tailwind CSS', 'Bootstrap', 'Material UI', 'Chakra UI', 'Shadcn/ui']

export default function UIBuilder() {
  const [componentName, setComponentName] = useState('')
  const [componentType, setComponentType] = useState('')
  const [framework, setFramework] = useState('')

  const handleCreateComponent = async () => {
    if (!componentName || !componentType || !framework) return

    try {
      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builder_type: 'ui',
          title: componentName,
          description: `${componentType} component built with ${framework}`,
          component_type: componentType,
          framework: framework,
        }),
      })

      if (response.ok) {
        const artifact = await response.json()
        window.location.href = `/dashboard/builders/ui/${artifact.id}`
      }
    } catch (error) {
      console.error('Error creating component:', error)
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
          <h1 className="text-3xl font-bold text-foreground">UI Components</h1>
          <p className="text-foreground/60">Design and generate UI components</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Create UI Component</CardTitle>
            <CardDescription>Design beautiful, reusable components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Component Name
              </label>
              <Input
                placeholder="e.g., Pricing Card"
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Component Type
              </label>
              <Select value={componentType} onValueChange={setComponentType}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select component type" />
                </SelectTrigger>
                <SelectContent>
                  {uiComponentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Framework
              </label>
              <Select value={framework} onValueChange={setFramework}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.map((fw) => (
                    <SelectItem key={fw} value={fw}>
                      {fw}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCreateComponent} className="w-full gap-2" disabled={!componentName || !componentType || !framework}>
              <Zap className="w-4 h-4" />
              Generate Component
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
