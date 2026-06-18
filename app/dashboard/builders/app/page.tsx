'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Zap } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const appTemplates = [
  {
    id: 'todo',
    name: 'Todo App',
    description: 'Task management and tracking',
    features: ['Lists', 'Tasks', 'Due Dates', 'Categories'],
  },
  {
    id: 'notes',
    name: 'Note Taking App',
    description: 'Capture and organize notes',
    features: ['Notes', 'Tags', 'Search', 'Folders'],
  },
  {
    id: 'budget',
    name: 'Budget Tracker',
    description: 'Track your finances',
    features: ['Transactions', 'Categories', 'Reports', 'Goals'],
  },
  {
    id: 'fitness',
    name: 'Fitness Tracker',
    description: 'Monitor your workouts',
    features: ['Workouts', 'Progress', 'Stats', 'Goals'],
  },
  {
    id: 'social',
    name: 'Social Feed',
    description: 'Share updates with friends',
    features: ['Posts', 'Comments', 'Likes', 'Profiles'],
  },
  {
    id: 'elearning',
    name: 'E-Learning Platform',
    description: 'Create and take courses',
    features: ['Courses', 'Lessons', 'Quizzes', 'Progress'],
  },
]

const frameworks = [
  { id: 'react-native', label: 'React Native', description: 'iOS & Android' },
  { id: 'flutter', label: 'Flutter', description: 'iOS & Android' },
  { id: 'web-react', label: 'React Web', description: 'Web Application' },
  { id: 'vue', label: 'Vue.js', description: 'Web Application' },
  { id: 'nextjs', label: 'Next.js', description: 'Full-stack Web' },
]

export default function AppBuilder() {
  const [step, setStep] = useState<'template' | 'config' | 'editor'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [appName, setAppName] = useState('')
  const [appDescription, setAppDescription] = useState('')
  const [framework, setFramework] = useState('')

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    setStep('config')
  }

  const handleCreateApp = async () => {
    if (!appName || !selectedTemplate || !framework) return

    try {
      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builder_type: 'app',
          title: appName,
          description: appDescription,
          template: selectedTemplate,
          framework: framework,
        }),
      })

      if (response.ok) {
        const artifact = await response.json()
        window.location.href = `/dashboard/builders/app/${artifact.id}`
      }
    } catch (error) {
      console.error('Error creating app:', error)
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
            <h1 className="text-3xl font-bold text-foreground">App Builder</h1>
            <p className="text-foreground/60">Create mobile and web apps with AI</p>
          </div>
        </div>
      </div>

      {step === 'template' && (
        <div className="space-y-6">
          <p className="text-foreground/60">Choose an app template to start building</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appTemplates.map((template) => (
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
                      {template.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                        >
                          {feature}
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
              <CardTitle>Configure Your App</CardTitle>
              <CardDescription>Set up your app details and framework</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  App Name
                </label>
                <Input
                  placeholder="e.g., My Todo App"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <Textarea
                  placeholder="Describe your app..."
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  className="bg-background border-border"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Framework
                </label>
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Select a framework" />
                  </SelectTrigger>
                  <SelectContent>
                    {frameworks.map((fw) => (
                      <SelectItem key={fw.id} value={fw.id}>
                        <span className="font-medium">{fw.label}</span>
                        <span className="text-foreground/60 ml-2">({fw.description})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  onClick={handleCreateApp}
                  disabled={!appName || !framework}
                  className="flex-1 gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Generate App
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
