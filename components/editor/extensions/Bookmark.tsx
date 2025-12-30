'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { Link2, ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BookmarkComponentProps {
  node: {
    attrs: {
      url?: string | null
      title?: string
      description?: string
      favicon?: string
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  deleteNode: () => void
}

const BookmarkComponent = ({ node, updateAttributes, deleteNode }: BookmarkComponentProps) => {
  const { url, title, description } = node.attrs
  const [showInput, setShowInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return

    setLoading(true)
    try {
      // Just set the URL - in production you'd fetch metadata
      const urlObj = new URL(urlInput.trim())
      updateAttributes({
        url: urlInput.trim(),
        title: urlObj.hostname,
        description: urlInput.trim(),
      })
      setShowInput(false)
      setUrlInput('')
    } catch {
      // Invalid URL
    } finally {
      setLoading(false)
    }
  }

  if (!url) {
    return (
      <NodeViewWrapper>
        <div
          className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-border my-2 bg-accent/20"
          contentEditable={false}
          data-testid="bookmark-placeholder"
        >
          <Link2 className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Add a bookmark</p>

          {showInput ? (
            <div className="flex gap-2 w-full max-w-md">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste URL..."
                className="flex-1 px-3 py-2 rounded-md border bg-background text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                autoFocus
              />
              <Button size="sm" onClick={handleUrlSubmit} disabled={loading}>
                {loading ? '...' : 'Add'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowInput(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowInput(true)}
            >
              <Link2 className="h-4 w-4 mr-2" />
              Add URL
            </Button>
          )}
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 rounded-lg border border-border my-2 hover:bg-accent/30 transition-colors group"
        contentEditable={false}
        data-testid="bookmark-block"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{title || url}</h4>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          </div>
          {description && (
            <p className="text-sm text-muted-foreground truncate mt-1">{description}</p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            deleteNode()
          }}
          className="p-1.5 rounded-md hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </a>
    </NodeViewWrapper>
  )
}

export const Bookmark = Node.create({
  name: 'bookmark',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      url: {
        default: null,
      },
      title: {
        default: '',
      },
      description: {
        default: '',
      },
      favicon: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="bookmark"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'bookmark' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(BookmarkComponent)
  },
})
