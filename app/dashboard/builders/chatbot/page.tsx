'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Zap } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const chatbotTemplates = [
  { id: 'support', name: 'Customer Support', description: 'Handle customer inquiries' },
  { id: 'sales', name: 'Sales Assistant', description: 'Qualify leads and close deals' },
  { id: 'onboarding', name: 'Onboarding', description: 'Guide new users' },
  { id: 'faq', name: 'FAQ Bot', description: 'Answer common questions' },
  { id: 'appointment', name: 'Appointment Scheduler', description: 'Book meetings' },
  { id: 'feedback', name: 'Feedback Collector', description: 'Gather user feedback' },
]

export default function ChatbotBuilder() {
  const [botName, setBotName] = useState('')
  const [description, setDescription] = useState('')
  const [template, setTemplate] = useState('')
  const [trainingData, setTrainingData] = useState('')

  const handleCreateChatbot = async () => {
    if (!botName || !template) return

    try {
      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builder_type: 'chatbot',
          title: botName,
          description,
          template,
          training_data: trainingData,
        }),
      })

      if (response.ok) {
        const artifact = await response.json()
        window.location.href = `/dashboard/builders/chatbot/${artifact.id}`
      }
    } catch (error) {
      console.error('Error creating chatbot:', error)
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
          <h1 className="text-3xl font-bold text-foreground">Chatbot Builder</h1>
          <p className="text-foreground/60">Create AI-powered chatbots</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Create Your Chatbot</CardTitle>
            <CardDescription>Set up a custom AI chatbot for your business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Chatbot Name
              </label>
              <Input
                placeholder="e.g., Support Assistant"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Bot Template
              </label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {chatbotTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {template && (
                <p className="text-sm text-foreground/60 mt-2">
                  {chatbotTemplates.find((t) => t.id === template)?.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Bot Description
              </label>
              <Textarea
                placeholder="Describe how this bot should behave and what tone it should use..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background border-border"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Training Data (Optional)
              </label>
              <Textarea
                placeholder="Paste your FAQ, knowledge base, or training content..."
                value={trainingData}
                onChange={(e) => setTrainingData(e.target.value)}
                className="bg-background border-border"
                rows={5}
              />
            </div>

            <Button onClick={handleCreateChatbot} className="w-full gap-2" disabled={!botName || !template}>
              <Zap className="w-4 h-4" />
              Create Chatbot
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
