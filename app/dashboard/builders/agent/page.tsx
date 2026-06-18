'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Zap } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

const agentCapabilities = [
  { id: 'research', name: 'Research & Analysis', icon: '🔍' },
  { id: 'writing', name: 'Content Writing', icon: '✍️' },
  { id: 'coding', name: 'Code Generation', icon: '💻' },
  { id: 'automation', name: 'Task Automation', icon: '⚙️' },
  { id: 'analysis', name: 'Data Analysis', icon: '📊' },
  { id: 'communication', name: 'Communication', icon: '💬' },
]

export default function AgentBuilder() {
  const [agentName, setAgentName] = useState('')
  const [description, setDescription] = useState('')
  const [capabilities, setCapabilities] = useState<string[]>([])

  const handleCreateAgent = async () => {
    if (!agentName) return

    try {
      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builder_type: 'agent',
          title: agentName,
          description,
          capabilities,
        }),
      })

      if (response.ok) {
        const artifact = await response.json()
        window.location.href = `/dashboard/builders/agent/${artifact.id}`
      }
    } catch (error) {
      console.error('Error creating agent:', error)
    }
  }

  const toggleCapability = (id: string) => {
    setCapabilities((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
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
          <h1 className="text-3xl font-bold text-foreground">AI Agent Builder</h1>
          <p className="text-foreground/60">Create autonomous AI agents</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Create Your AI Agent</CardTitle>
            <CardDescription>Define your agent's purpose and capabilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Agent Name
              </label>
              <Input
                placeholder="e.g., Research Assistant"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Agent Description
              </label>
              <Textarea
                placeholder="Describe what this agent does and how it should behave..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background border-border"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Agent Capabilities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {agentCapabilities.map((capability) => (
                  <button
                    key={capability.id}
                    onClick={() => toggleCapability(capability.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors flex items-center gap-2 ${
                      capabilities.includes(capability.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Checkbox checked={capabilities.includes(capability.id)} onChange={() => {}} />
                    <div>
                      <div className="text-lg">{capability.icon}</div>
                      <div className="text-sm font-medium text-foreground">{capability.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleCreateAgent} className="w-full gap-2" disabled={!agentName}>
              <Zap className="w-4 h-4" />
              Create Agent
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
