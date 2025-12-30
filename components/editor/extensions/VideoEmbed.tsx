'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { Video, X, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoEmbedComponentProps {
  node: {
    attrs: {
      src?: string | null
      provider?: string
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  deleteNode: () => void
}

function getEmbedUrl(url: string): { embedUrl: string; provider: string } | null {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (youtubeMatch) {
    return {
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
      provider: 'youtube'
    }
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      provider: 'vimeo'
    }
  }

  // Loom
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
  if (loomMatch) {
    return {
      embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`,
      provider: 'loom'
    }
  }

  return null
}

const VideoEmbedComponent = ({ node, updateAttributes, deleteNode }: VideoEmbedComponentProps) => {
  const { src, provider } = node.attrs
  const [showInput, setShowInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return

    const result = getEmbedUrl(urlInput.trim())
    if (result) {
      updateAttributes({ src: result.embedUrl, provider: result.provider })
      setShowInput(false)
      setUrlInput('')
    }
  }

  if (!src) {
    return (
      <NodeViewWrapper>
        <div
          className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-border my-2 bg-accent/20"
          contentEditable={false}
          data-testid="video-placeholder"
        >
          <Video className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Embed a video</p>
          <p className="text-xs text-muted-foreground mb-4">Supports YouTube, Vimeo, Loom</p>

          {showInput ? (
            <div className="flex gap-2 w-full max-w-md">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste video URL..."
                className="flex-1 px-3 py-2 rounded-md border bg-background text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                autoFocus
              />
              <Button size="sm" onClick={handleUrlSubmit}>Embed</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowInput(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowInput(true)}>
              <Play className="h-4 w-4 mr-2" />
              Add video URL
            </Button>
          )}
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <div
        className="my-4 group relative"
        contentEditable={false}
        data-testid="video-block"
      >
        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={src}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <button
          onClick={deleteNode}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
        {provider && (
          <p className="text-xs text-muted-foreground mt-2 text-center capitalize">{provider}</p>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const VideoEmbed = Node.create({
  name: 'videoEmbed',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      provider: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="video-embed"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'video-embed' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoEmbedComponent)
  },
})
