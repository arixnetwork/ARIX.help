'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Zap } from 'lucide-react'

const websiteTemplates = [
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Perfect for startups and product launches',
    sections: ['Hero', 'Features', 'Pricing', 'CTA'],
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Showcase your work and skills',
    sections: ['Hero', 'Projects', 'About', 'Contact'],
  },
  {
    id: 'saas',
    name: 'SaaS Marketing',
    description: 'Sell your software product',
    sections: ['Hero', 'Features', 'Pricing', 'FAQ', 'CTA'],
  },
  {
    id: 'agency',
    name: 'Agency Site',
    description: 'Show services and case studies',
    sections: ['Hero', 'Services', 'Portfolio', 'Team', 'Contact'],
  },
  {
    id: 'blog',
    name: 'Blog',
    description: 'Share your thoughts and stories',
    sections: ['Hero', 'Blog List', 'Categories', 'Subscribe'],
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Sell products online',
    sections: ['Hero', 'Products', 'Cart', 'Reviews', 'Checkout'],
  },
]

export default function WebsiteBuilder() {
  const [step, setStep] = useState<'template' | 'config' | 'editor'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [siteName, setSiteName] = useState('')
  const [siteDescription, setSiteDescription] = useState('')

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    setStep('config')
  }

  const handleCreateWebsite = async () => {
    if (!siteName || !selectedTemplate) return

    try {
      // Create artifact
      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builder_type: 'website',
          title: siteName,
          description: siteDescription,
          template: selectedTemplate,
        }),
      })

      if (response.ok) {
        const artifact = await response.json()
        window.location.href = `/dashboard/builders/website/${artifact.id}`
      }
    } catch (error) {
      console.error('Error creating website:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Website Builder</h1>
            <p className="text-foreground/60">Create beautiful websites with AI</p>
          </div>
        </div>
      </div>

      {step === 'template' && (
        <div className="space-y-6">
          <p className="text-foreground/60">Choose a template to get started</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {websiteTemplates.map((template) => (
              <Card
                key={template.id}
                className="bg-card border-border cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {template.sections.map((section) => (
                        <span
                          key={section}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                        >
                          {section}
                        </span>
                      ))}
                    </div>
                    <Button className="w-full" variant="outline" size="sm">
                      Select Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 'config' && selectedTemplate && (
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Configure Your Website</CardTitle>
              <CardDescription>Tell us about your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Website Name
                </label>
                <Input
                  placeholder="e.g., My Awesome Product"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Website Description
                </label>
                <Textarea
                  placeholder="Describe what your website is about..."
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  className="bg-background border-border"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('template')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateWebsite}
                  disabled={!siteName}
                  className="flex-1 gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Generate Website
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
