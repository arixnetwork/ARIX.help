'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Heart, Search, Zap } from 'lucide-react'

interface AIPrompt {
  id: string
  name: string
  description: string
  category: string
  emoji: string
  color: string
  is_active: boolean
}

interface PromptSelectorProps {
  onPromptSelect: (prompt: AIPrompt) => void
  selectedPrompt?: AIPrompt | null
  isLoading?: boolean
}

export function PromptSelector({
  onPromptSelect,
  selectedPrompt,
  isLoading = false,
}: PromptSelectorProps) {
  const [prompts, setPrompts] = useState<AIPrompt[]>([])
  const [favoritePrompts, setFavoritePrompts] = useState<AIPrompt[]>([])
  const [recentPrompts, setRecentPrompts] = useState<AIPrompt[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredPrompts, setFilteredPrompts] = useState<AIPrompt[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchPrompts()
    fetchUserPreferences()
  }, [])

  useEffect(() => {
    filterPrompts()
  }, [searchQuery, prompts, selectedCategory])

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/prompts')
      if (response.ok) {
        const data = await response.json()
        setPrompts(data.prompts)
      }
    } catch (error) {
      console.error('[v0] Failed to fetch prompts:', error)
    }
  }

  const fetchUserPreferences = async () => {
    try {
      const favResponse = await fetch('/api/prompts/favorites')
      if (favResponse.ok) {
        const favData = await favResponse.json()
        setFavoritePrompts(favData.favorites || [])
        setFavorites(new Set(favData.favorites.map((p: AIPrompt) => p.id)))
      }

      const recentResponse = await fetch('/api/prompts/recent')
      if (recentResponse.ok) {
        const recentData = await recentResponse.json()
        setRecentPrompts(recentData.recent || [])
      }
    } catch (error) {
      console.error('[v0] Failed to fetch user preferences:', error)
    }
  }

  const filterPrompts = () => {
    let filtered = prompts
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      )
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }
    
    setFilteredPrompts(filtered)
  }

  const handleSelectPrompt = async (prompt: AIPrompt) => {
    onPromptSelect(prompt)
    setIsOpen(false)
    
    // Record usage
    try {
      await fetch('/api/prompts/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId: prompt.id }),
      })
    } catch (error) {
      console.error('[v0] Failed to record prompt usage:', error)
    }
  }

  const handleToggleFavorite = async (promptId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const newFavorites = new Set(favorites)
    const isFavorite = !newFavorites.has(promptId)
    
    if (isFavorite) {
      newFavorites.add(promptId)
    } else {
      newFavorites.delete(promptId)
    }
    
    setFavorites(newFavorites)
    
    try {
      await fetch('/api/prompts/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, isFavorite }),
      })
      
      // Refetch preferences
      fetchUserPreferences()
    } catch (error) {
      console.error('[v0] Failed to update favorite:', error)
    }
  }

  const categories = ['all', ...new Set(prompts.map(p => p.category))]

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            {selectedPrompt ? (
              <>
                <span className="text-lg">{selectedPrompt.emoji}</span>
                <span className="text-sm">{selectedPrompt.name}</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Select AI Prompt...</span>
            )}
          </div>
          <Zap className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="space-y-4 p-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>

          {/* Recent prompts */}
          {recentPrompts.length > 0 && selectedCategory === 'all' && !searchQuery && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Recently Used</p>
              <div className="space-y-1">
                {recentPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    onClick={() => handleSelectPrompt(prompt)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">{prompt.emoji}</span>
                      <div>
                        <p className="text-sm font-medium">{prompt.name}</p>
                        <p className="text-xs text-muted-foreground">{prompt.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleToggleFavorite(prompt.id, e)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={favorites.has(prompt.id) ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>
                ))}
              </div>
              <div className="my-3 border-t" />
            </div>
          )}

          {/* Favorite prompts */}
          {favoritePrompts.length > 0 && selectedCategory === 'all' && !searchQuery && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Favorites</p>
              <div className="space-y-1">
                {favoritePrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    onClick={() => handleSelectPrompt(prompt)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">{prompt.emoji}</span>
                      <div>
                        <p className="text-sm font-medium">{prompt.name}</p>
                        <p className="text-xs text-muted-foreground">{prompt.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleToggleFavorite(prompt.id, e)}
                      className="text-red-500"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="my-3 border-t" />
            </div>
          )}

          {/* All prompts */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              {searchQuery || selectedCategory !== 'all' ? 'Results' : 'All Prompts'}
            </p>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredPrompts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No prompts found
                </p>
              ) : (
                filteredPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    onClick={() => handleSelectPrompt(prompt)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">{prompt.emoji}</span>
                      <div>
                        <p className="text-sm font-medium">{prompt.name}</p>
                        <p className="text-xs text-muted-foreground">{prompt.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleToggleFavorite(prompt.id, e)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={favorites.has(prompt.id) ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
