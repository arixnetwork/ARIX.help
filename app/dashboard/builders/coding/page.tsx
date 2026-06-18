'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Zap } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const languages = ['JavaScript', 'Python', 'TypeScript', 'Go', 'Rust', 'Java', 'C++', 'PHP']

export default function CodingBuilder() {
  const [snippetName, setSnippetName] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('')

  const handleCreateSnippet = async () => {
    if (!snippetName || !language) return

    try {
      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builder_type: 'coding',
          title: snippetName,
          description,
          language,
        }),
      })

      if (response.ok) {
        const artifact = await response.json()
        window.location.href = `/dashboard/builders/coding/${artifact.id}`
      }
    } catch (error) {
      console.error('Error creating snippet:', error)
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
          <h1 className="text-3xl font-bold text-foreground">Code Snippets</h1>
          <p className="text-foreground/60">Generate code for any language</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Generate Code Snippet</CardTitle>
            <CardDescription>AI-powered code generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Snippet Name
              </label>
              <Input
                placeholder="e.g., Recursive Fibonacci"
                value={snippetName}
                onChange={(e) => setSnippetName(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                What do you want to build?
              </label>
              <Textarea
                placeholder="Describe the functionality you need..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background border-border"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Programming Language
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCreateSnippet} className="w-full gap-2" disabled={!snippetName || !language}>
              <Zap className="w-4 h-4" />
              Generate Code
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
