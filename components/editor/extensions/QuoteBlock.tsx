'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { Quote, X } from 'lucide-react'

interface QuoteBlockComponentProps {
  node: {
    attrs: {
      quote?: string
      author?: string
      source?: string
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  deleteNode: () => void
}

const QuoteBlockComponent = ({ node, updateAttributes, deleteNode }: QuoteBlockComponentProps) => {
  const { quote, author, source } = node.attrs
  const [isEditing, setIsEditing] = useState(!quote)

  if (isEditing) {
    return (
      <NodeViewWrapper>
        <div
          className="my-4 p-4 rounded-lg border border-border bg-card"
          contentEditable={false}
          data-testid="quote-editor"
        >
          <div className="flex items-center gap-2 mb-4">
            <Quote className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Quote Block</span>
          </div>
          <div className="space-y-3">
            <textarea
              value={quote || ''}
              onChange={(e) => updateAttributes({ quote: e.target.value })}
              placeholder="Enter quote text..."
              className="w-full px-3 py-2 rounded-md border bg-background text-sm min-h-[80px] resize-none"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={author || ''}
                onChange={(e) => updateAttributes({ author: e.target.value })}
                placeholder="Author name"
                className="px-3 py-2 rounded-md border bg-background text-sm"
              />
              <input
                type="text"
                value={source || ''}
                onChange={(e) => updateAttributes({ source: e.target.value })}
                placeholder="Source (optional)"
                className="px-3 py-2 rounded-md border bg-background text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground"
              >
                Done
              </button>
              <button
                onClick={deleteNode}
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <figure
        className="group relative my-6 pl-6 border-l-4 border-primary/50 cursor-pointer hover:bg-accent/20 rounded-r-lg py-4 pr-4 transition-colors"
        contentEditable={false}
        onClick={() => setIsEditing(true)}
        data-testid="quote-block"
      >
        <Quote className="absolute -left-3 -top-2 h-6 w-6 text-primary/30 bg-background rounded" />
        <blockquote className="text-lg italic text-foreground/90">
          "{quote || 'Click to add quote'}"
        </blockquote>
        {(author || source) && (
          <figcaption className="mt-3 text-sm text-muted-foreground">
            {author && <span className="font-medium">{author}</span>}
            {author && source && <span> — </span>}
            {source && <cite className="not-italic">{source}</cite>}
          </figcaption>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            deleteNode()
          }}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-background border opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      </figure>
    </NodeViewWrapper>
  )
}

export const QuoteBlock = Node.create({
  name: 'quoteBlock',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      quote: {
        default: null,
      },
      author: {
        default: '',
      },
      source: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="quote-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes, { 'data-type': 'quote-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuoteBlockComponent)
  },
})
