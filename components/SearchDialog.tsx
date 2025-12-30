'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText, Tag as TagIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Page, Tag } from '@/lib/db/schema'

interface PageWithTags extends Page {
  tags?: Tag[]
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pages: Page[]
  workspaceId?: string
}

export function SearchDialog({ open, onOpenChange, pages, workspaceId }: SearchDialogProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [pagesWithTags, setPagesWithTags] = useState<Map<string, Tag[]>>(new Map())

  // Fetch all tags and page-tag mappings when dialog opens
  useEffect(() => {
    if (!open || !workspaceId) return

    async function fetchTagData() {
      try {
        // Fetch all tags
        const tagsRes = await fetch(`/api/tags?workspace_id=${workspaceId}`)
        if (tagsRes.ok) {
          const { tags } = await tagsRes.json()
          setAllTags(tags || [])
        }

        // Fetch page tags for each page (simple approach - could be optimized with a batch endpoint)
        const tagMap = new Map<string, Tag[]>()
        for (const page of pages.slice(0, 50)) {
          const res = await fetch(`/api/pages/${page.id}/tags`)
          if (res.ok) {
            const { tags } = await res.json()
            if (tags && tags.length > 0) {
              tagMap.set(page.id, tags)
            }
          }
        }
        setPagesWithTags(tagMap)
      } catch (error) {
        console.error('Failed to fetch tag data:', error)
      }
    }

    fetchTagData()
  }, [open, workspaceId, pages])

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const filteredPages = useMemo(() => {
    let results = pages

    // Filter by selected tags
    if (selectedTags.length > 0) {
      results = results.filter(page => {
        const pageTags = pagesWithTags.get(page.id) || []
        return selectedTags.every(tagId =>
          pageTags.some(t => t.id === tagId)
        )
      })
    }

    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase()
      results = results.filter(page => {
        const titleMatch = page.title.toLowerCase().includes(lowerQuery)
        const contentMatch = page.content
          ? JSON.stringify(page.content).toLowerCase().includes(lowerQuery)
          : false
        return titleMatch || contentMatch
      })
    }

    return results.slice(0, 20)
  }, [query, pages, selectedTags, pagesWithTags])

  const handleSelect = (pageId: string) => {
    router.push(`/page/${pageId}`)
    onOpenChange(false)
    setQuery('')
    setSelectedTags([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-xl">
        <VisuallyHidden>
          <DialogTitle>Search pages</DialogTitle>
        </VisuallyHidden>
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 border-b overflow-x-auto">
            <TagIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            {allTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedTags.includes(tag.id)
                    ? 'text-white'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
                style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
              >
                {tag.name}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="px-2 py-0.5 rounded-full text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        )}

        <ScrollArea className="max-h-80">
          {filteredPages.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>No pages found</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredPages.map(page => {
                const pageTags = pagesWithTags.get(page.id) || []
                return (
                  <button
                    key={page.id}
                    onClick={() => handleSelect(page.id)}
                    className="flex items-center gap-3 w-full px-3 py-2 text-left rounded-md hover:bg-accent transition-colors"
                  >
                    <span className="text-lg">{page.icon || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{page.title}</p>
                      <div className="flex items-center gap-2">
                        {page.path && page.path.length > 0 && (
                          <p className="text-xs text-muted-foreground truncate">
                            in {page.path.join(' / ')}
                          </p>
                        )}
                        {pageTags.length > 0 && (
                          <div className="flex gap-1">
                            {pageTags.slice(0, 3).map(tag => (
                              <span
                                key={tag.id}
                                className="px-1.5 py-0.5 rounded text-[10px] text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
