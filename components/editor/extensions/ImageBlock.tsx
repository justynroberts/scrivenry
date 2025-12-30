'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { ImageIcon, Link, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageBlockComponentProps {
  node: {
    attrs: {
      src?: string | null
      alt?: string
      caption?: string
      width?: string
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  deleteNode: () => void
}

const ImageBlockComponent = ({ node, updateAttributes, deleteNode }: ImageBlockComponentProps) => {
  const { src, alt, caption, width } = node.attrs
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      updateAttributes({ src: urlInput.trim() })
      setShowUrlInput(false)
      setUrlInput('')
    }
  }

  if (!src) {
    return (
      <NodeViewWrapper>
        <div
          className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-border my-2 bg-accent/20"
          contentEditable={false}
          data-testid="image-placeholder"
        >
          <ImageIcon className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Add an image</p>

          {showUrlInput ? (
            <div className="flex gap-2 w-full max-w-md">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste image URL..."
                className="flex-1 px-3 py-2 rounded-md border bg-background text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                autoFocus
              />
              <Button size="sm" onClick={handleUrlSubmit}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowUrlInput(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowUrlInput(true)}
              >
                <Link className="h-4 w-4 mr-2" />
                Embed URL
              </Button>
            </div>
          )}
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <figure
        className="my-4 group relative"
        data-testid="image-block"
      >
        <div className="relative">
          <img
            src={src}
            alt={alt}
            className="rounded-lg max-w-full mx-auto"
            style={{ width: width || 'auto' }}
          />
          <button
            onClick={deleteNode}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
            contentEditable={false}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {caption && (
          <figcaption className="text-center text-sm text-muted-foreground mt-2">
            {caption}
          </figcaption>
        )}
      </figure>
    </NodeViewWrapper>
  )
}

export const ImageBlock = Node.create({
  name: 'imageBlock',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: '',
      },
      caption: {
        default: '',
      },
      width: {
        default: '100%',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes, { 'data-type': 'image-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockComponent)
  },
})
