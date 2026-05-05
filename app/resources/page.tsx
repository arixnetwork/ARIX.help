'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Search, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'

interface Resource {
  id: string
  title: string
  slug: string
  category: string
  content: string
  author_id: string
  views: number
  created_at: string
}

const CATEGORIES = [
  { id: 'all', label: 'All Resources' },
  { id: 'coding', label: 'Coding' },
  { id: 'design', label: 'Design' },
  { id: 'seo', label: 'SEO' },
  { id: 'saas', label: 'SaaS' },
  { id: 'deployment', label: 'Deployment' },
  { id: 'performance', label: 'Performance' },
]

export default function ResourcesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
    }

    checkAuth()
  }, [router])

  // Fetch resources
  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (selectedCategory !== 'all') params.append('category', selectedCategory)
        if (search) params.append('search', search)
        params.append('page', page.toString())

        const response = await fetch(`/api/resources?${params}`)
        const data = await response.json()

        setResources(data.resources)
        setTotal(data.total)
      } catch (error) {
        console.error('Error fetching resources:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResources()
  }, [selectedCategory, search, page])

  const pageSize = 12
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/chat" className="text-2xl font-bold text-primary flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              ARIX
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/chat">
                <Button variant="ghost" className="text-foreground">
                  Chat
                </Button>
              </Link>
              <Button
                onClick={() => supabase.auth.signOut()}
                variant="outline"
                className="border-border hover:bg-card text-foreground"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-12 border-b border-border/30 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Resource Library</h1>
          <p className="text-foreground/60 text-lg">
            Browse guides, tutorials, and best practices for every aspect of web development
          </p>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
              <Input
                placeholder="Search resources..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10 bg-input border-border text-foreground placeholder:text-foreground/50"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id)
                    setPage(1)
                  }}
                  className={`${
                    selectedCategory === cat.id
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'bg-card border border-border hover:bg-card/80 text-foreground'
                  }`}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-foreground/60">Loading resources...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
              <p className="text-foreground/60">No resources found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {resources.map((resource) => (
                  <Link
                    key={resource.id}
                    href={`/resources/${resource.slug}`}
                    className="group"
                  >
                    <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition h-full flex flex-col">
                      <div className="mb-4">
                        <span className="inline-block px-2 py-1 bg-primary/20 text-primary text-xs font-semibold rounded">
                          {resource.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition line-clamp-2">
                        {resource.title}
                      </h3>
                      <p className="text-foreground/60 text-sm mb-4 flex-1 line-clamp-3">
                        {resource.content.substring(0, 150)}...
                      </p>
                      <div className="flex items-center justify-between text-xs text-foreground/50">
                        <span>{resource.views} views</span>
                        <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    variant="outline"
                    className="border-border hover:bg-card text-foreground"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <span className="text-foreground/60">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    variant="outline"
                    className="border-border hover:bg-card text-foreground"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
