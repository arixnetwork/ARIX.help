'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Zap, CheckCircle2, AlertCircle } from 'lucide-react'

export default function SEOBuilder() {
  const [pageTitle, setPageTitle] = useState('')
  const [pageDescription, setPageDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [content, setContent] = useState('')
  const [seoScore, setSeoScore] = useState<number | null>(null)

  const calculateScore = () => {
    let score = 0
    
    if (pageTitle.length >= 30 && pageTitle.length <= 60) score += 20
    else if (pageTitle.length > 0) score += 10
    
    if (pageDescription.length >= 120 && pageDescription.length <= 160) score += 20
    else if (pageDescription.length > 0) score += 10
    
    if (keywords.split(',').length >= 3) score += 20
    else if (keywords) score += 10
    
    if (content.length >= 300) score += 20
    else if (content) score += 10
    
    if (pageTitle && pageDescription) score += 10
    
    setSeoScore(score)
  }

  const handleOptimize = async () => {
    if (!pageTitle || !pageDescription) return

    calculateScore()

    try {
      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builder_type: 'seo',
          title: pageTitle,
          description: pageDescription,
          content: {
            title: pageTitle,
            description: pageDescription,
            keywords: keywords.split(',').map((k) => k.trim()),
            content,
          },
        }),
      })

      if (response.ok) {
        const artifact = await response.json()
        window.location.href = `/dashboard/builders/seo/${artifact.id}`
      }
    } catch (error) {
      console.error('Error optimizing SEO:', error)
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
          <h1 className="text-3xl font-bold text-foreground">SEO Optimizer</h1>
          <p className="text-foreground/60">Optimize your content for search engines</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Optimize Your Page</CardTitle>
              <CardDescription>Enter your page content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Page Title ({pageTitle.length}/60)
                </label>
                <Input
                  placeholder="e.g., Best Coffee Shops in New York | Local Guide"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value.slice(0, 60))}
                  className="bg-background border-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meta Description ({pageDescription.length}/160)
                </label>
                <Textarea
                  placeholder="e.g., Discover the best coffee shops in NYC. Read reviews, hours, and locations..."
                  value={pageDescription}
                  onChange={(e) => setPageDescription(e.target.value.slice(0, 160))}
                  className="bg-background border-border"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Keywords (comma-separated)
                </label>
                <Input
                  placeholder="e.g., coffee shops, NYC, espresso, cafes"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Page Content
                </label>
                <Textarea
                  placeholder="Your full page content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="bg-background border-border"
                  rows={6}
                />
              </div>

              <Button onClick={handleOptimize} className="w-full gap-2" disabled={!pageTitle || !pageDescription}>
                <Zap className="w-4 h-4" />
                Optimize for SEO
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-card border-border sticky top-4">
            <CardHeader>
              <CardTitle>SEO Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {seoScore !== null ? (
                <>
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${
                      seoScore >= 80 ? 'text-green-500' : 
                      seoScore >= 60 ? 'text-yellow-500' : 
                      'text-red-500'
                    }`}>
                      {seoScore}
                    </div>
                    <p className="text-sm text-foreground/60">out of 100</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {pageTitle.length >= 30 && pageTitle.length <= 60 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-sm text-foreground/70">Title length</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {pageDescription.length >= 120 && pageDescription.length <= 160 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-sm text-foreground/70">Description</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {keywords.split(',').length >= 3 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-sm text-foreground/70">Keywords</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-foreground/60 text-center py-4">
                  Fill in the form to calculate your SEO score
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
