'use client'

import { useState, useEffect } from 'react'
import { Tag as TagIcon, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { Tag } from '@/lib/db/schema'

const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
]

interface TagPickerProps {
  pageId: string
  workspaceId: string
  pageTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
}

export function TagPicker({ pageId, workspaceId, pageTags, onTagsChange }: TagPickerProps) {
  const [open, setOpen] = useState(false)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[6])
  const [loading, setLoading] = useState(false)

  // Fetch all workspace tags
  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch(`/api/tags?workspace_id=${workspaceId}`)
        if (res.ok) {
          const data = await res.json()
          setAllTags(data.tags || [])
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error)
      }
    }
    if (open) {
      fetchTags()
    }
  }, [workspaceId, open])

  const handleAddTag = async (tag: Tag) => {
    try {
      await fetch(`/api/pages/${pageId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: tag.id }),
      })
      onTagsChange([...pageTags, tag])
    } catch (error) {
      console.error('Failed to add tag:', error)
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    try {
      await fetch(`/api/pages/${pageId}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      })
      onTagsChange(pageTags.filter(t => t.id !== tagId))
    } catch (error) {
      console.error('Failed to remove tag:', error)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          name: newTagName.trim(),
          color: newTagColor,
        }),
      })

      if (res.ok) {
        const { tag } = await res.json()
        setAllTags([...allTags, tag])
        await handleAddTag(tag)
        setNewTagName('')
      }
    } catch (error) {
      console.error('Failed to create tag:', error)
    } finally {
      setLoading(false)
    }
  }

  const isTagSelected = (tagId: string) => pageTags.some(t => t.id === tagId)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Display current tags */}
      {pageTags.map(tag => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: tag.color }}
        >
          {tag.name}
          <button
            onClick={() => handleRemoveTag(tag.id)}
            className="hover:bg-white/20 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {/* Add tag button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-muted-foreground"
          >
            <TagIcon className="h-3.5 w-3.5 mr-1" />
            {pageTags.length === 0 ? 'Add tags' : ''}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-2">
            {/* Existing tags */}
            <div className="text-xs font-medium text-muted-foreground px-1">
              Select tags
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => isTagSelected(tag.id) ? handleRemoveTag(tag.id) : handleAddTag(tag)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent transition-colors"
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-sm text-left">{tag.name}</span>
                  {isTagSelected(tag.id) && (
                    <span className="text-xs text-muted-foreground">Selected</span>
                  )}
                </button>
              ))}
              {allTags.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No tags yet
                </div>
              )}
            </div>

            {/* Create new tag */}
            <div className="border-t pt-2">
              <div className="text-xs font-medium text-muted-foreground px-1 mb-2">
                Create new tag
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name"
                  className="flex-1 px-2 py-1 text-sm border rounded bg-background"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                />
                <Button
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || loading}
                  className="h-7"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex gap-1 mt-2">
                {TAG_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={`w-5 h-5 rounded-full ${newTagColor === color ? 'ring-2 ring-offset-2 ring-offset-background ring-primary' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
