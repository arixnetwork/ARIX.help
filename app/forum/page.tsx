'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Search, MessageSquare, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface ForumPost {
  id: string
  title: string
  slug: string
  content: string
  category: string
  user_id: string
  upvotes: number
  created_at: string
  user: { username: string; avatar_url: string }
  forum_replies: { count: number }[]
}

const CATEGORIES = [
  { id: 'all', label: 'All Discussions' },
  { id: 'general', label: 'General' },
  { id: 'help', label: 'Help' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'feedback', label: 'Feedback' },
]

export default function ForumPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPostForm, setNewPostForm] = useState({ title: '', category: 'general', content: '' })
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

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (selectedCategory !== 'all') params.append('category', selectedCategory)
        if (search) params.append('search', search)
        params.append('page', page.toString())

        const response = await fetch(`/api/forum?${params}`)
        const data = await response.json()

        setPosts(data.posts)
        setTotal(data.total)
      } catch (error) {
        console.error('Error fetching posts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [selectedCategory, search, page])

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPostForm.title || !newPostForm.content) {
      alert('Please fill in all fields')
      return
    }

    try {
      const slug = newPostForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const response = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPostForm.title,
          slug,
          content: newPostForm.content,
          category: newPostForm.category,
        }),
      })

      if (response.ok) {
        setShowNewPost(false)
        setNewPostForm({ title: '', category: 'general', content: '' })
        setPage(1)
        // Refetch posts
        const params = new URLSearchParams()
        if (selectedCategory !== 'all') params.append('category', selectedCategory)
        params.append('page', '1')

        const fetchResponse = await fetch(`/api/forum?${params}`)
        const data = await fetchResponse.json()
        setPosts(data.posts)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post')
    }
  }

  const pageSize = 12
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/chat" className="text-2xl font-bold text-primary flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4">Community Forums</h1>
              <p className="text-foreground/60 text-lg">
                Connect, share, and learn from the ARIX community
              </p>
            </div>
            <Button
              onClick={() => setShowNewPost(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Discussion
            </Button>
          </div>
        </div>
      </section>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Start a New Discussion</h2>
              <button
                onClick={() => setShowNewPost(false)}
                className="text-foreground/60 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={newPostForm.title}
                  onChange={(e) => setNewPostForm({ ...newPostForm, title: e.target.value })}
                  placeholder="What's your question or topic?"
                  className="bg-input border-border text-foreground placeholder:text-foreground/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={newPostForm.category}
                  onChange={(e) => setNewPostForm({ ...newPostForm, category: e.target.value })}
                  className="w-full bg-input border border-border rounded-lg p-2 text-foreground"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-card">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={newPostForm.content}
                  onChange={(e) => setNewPostForm({ ...newPostForm, content: e.target.value })}
                  placeholder="Describe your topic in detail..."
                  rows={6}
                  className="bg-input border-border text-foreground placeholder:text-foreground/50"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  onClick={() => setShowNewPost(false)}
                  variant="outline"
                  className="border-border hover:bg-card text-foreground"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Post Discussion
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <section className="py-8 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
              <Input
                placeholder="Search discussions..."
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

      {/* Posts List */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-foreground/60">Loading discussions...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
              <p className="text-foreground/60">No discussions found</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-12">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/forum/${post.slug}`}
                    className="group"
                  >
                    <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="inline-block px-2 py-1 bg-primary/20 text-primary text-xs font-semibold rounded">
                              {post.category}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition">
                            {post.title}
                          </h3>
                          <p className="text-foreground/60 text-sm line-clamp-2 mb-4">
                            {post.content.substring(0, 150)}...
                          </p>
                          <div className="flex items-center gap-6 text-xs text-foreground/50">
                            <span>by {post.user?.username || 'Anonymous'}</span>
                            <span>{post.upvotes} upvotes</span>
                            <span>{post.forum_replies?.[0]?.count || 0} replies</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
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
