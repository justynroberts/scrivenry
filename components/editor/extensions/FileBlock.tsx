'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { FileIcon, X, Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileBlockComponentProps {
  node: {
    attrs: {
      url?: string | null
      filename?: string
      filesize?: string
      filetype?: string
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  deleteNode: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getFileIcon(type: string): string {
  if (type.includes('pdf')) return 'PDF'
  if (type.includes('word') || type.includes('doc')) return 'DOC'
  if (type.includes('excel') || type.includes('sheet')) return 'XLS'
  if (type.includes('zip') || type.includes('rar')) return 'ZIP'
  if (type.includes('image')) return 'IMG'
  return 'FILE'
}

const FileBlockComponent = ({ node, updateAttributes, deleteNode }: FileBlockComponentProps) => {
  const { url, filename, filesize, filetype } = node.attrs
  const [showInput, setShowInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [nameInput, setNameInput] = useState('')

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return

    const name = nameInput.trim() || urlInput.split('/').pop() || 'file'
    updateAttributes({
      url: urlInput.trim(),
      filename: name,
      filesize: 'Unknown',
      filetype: name.split('.').pop() || 'file',
    })
    setShowInput(false)
    setUrlInput('')
    setNameInput('')
  }

  if (!url) {
    return (
      <NodeViewWrapper>
        <div
          className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-border my-2 bg-accent/20"
          contentEditable={false}
          data-testid="file-placeholder"
        >
          <FileIcon className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Add a file</p>

          {showInput ? (
            <div className="flex flex-col gap-2 w-full max-w-md">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="File URL..."
                className="px-3 py-2 rounded-md border bg-background text-sm"
                autoFocus
              />
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="File name (optional)"
                className="px-3 py-2 rounded-md border bg-background text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" onClick={handleUrlSubmit}>Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowInput(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowInput(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Add file URL
            </Button>
          )}
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <div
        className="flex items-center gap-3 p-4 rounded-lg border border-border my-2 group hover:bg-accent/30 transition-colors"
        contentEditable={false}
        data-testid="file-block"
      >
        <div className="w-10 h-10 rounded bg-accent flex items-center justify-center text-xs font-bold text-muted-foreground">
          {getFileIcon(filetype || '')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{filename}</p>
          <p className="text-xs text-muted-foreground">{filesize}</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-md hover:bg-accent"
        >
          <Download className="h-4 w-4" />
        </a>
        <button
          onClick={deleteNode}
          className="p-2 rounded-md hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </NodeViewWrapper>
  )
}

export const FileBlock = Node.create({
  name: 'fileBlock',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      url: {
        default: null,
      },
      filename: {
        default: '',
      },
      filesize: {
        default: '',
      },
      filetype: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="file-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'file-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileBlockComponent)
  },
})
