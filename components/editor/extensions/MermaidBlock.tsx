'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { GitBranch, Play, Code, Eye, Copy, Check } from 'lucide-react'

interface MermaidBlockProps {
  node: {
    attrs: {
      code: string
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
}

function MermaidBlockComponent({ node, updateAttributes }: MermaidBlockProps) {
  const [code, setCode] = useState(node.attrs.code || `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`)
  const [isEditing, setIsEditing] = useState(!node.attrs.code)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const renderDiagram = useCallback(async () => {
    try {
      // Dynamically import mermaid
      const mermaid = (await import('mermaid')).default
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      })

      const id = `mermaid-${Date.now()}`
      const { svg } = await mermaid.render(id, code)
      setSvg(svg)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render diagram')
      setSvg('')
    }
  }, [code])

  useEffect(() => {
    if (!isEditing && code) {
      renderDiagram()
    }
  }, [isEditing, code, renderDiagram])

  const handleSave = () => {
    updateAttributes({ code })
    setIsEditing(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <NodeViewWrapper className="my-4">
      <div className="border border-purple-500/30 rounded-lg overflow-hidden bg-purple-950/20">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-purple-900/30 border-b border-purple-500/30">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Mermaid Diagram</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-purple-800/50 text-purple-400"
              title="Copy code"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 rounded hover:bg-purple-800/50 text-purple-400"
              title={isEditing ? 'Preview' : 'Edit'}
            >
              {isEditing ? <Eye className="h-3.5 w-3.5" /> : <Code className="h-3.5 w-3.5" />}
            </button>
            {isEditing && (
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs"
              >
                <Play className="h-3 w-3" />
                Render
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="p-3">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-48 bg-black/30 text-purple-100 font-mono text-sm p-3 rounded border border-purple-500/20 focus:border-purple-500/50 focus:outline-none resize-none"
              placeholder="Enter Mermaid diagram code..."
              spellCheck={false}
            />
            <p className="text-xs text-purple-400/60 mt-2">
              Supports flowchart, sequence, class, state, ER, and more. See mermaid.js.org for syntax.
            </p>
          </div>
        ) : (
          <div className="p-4">
            {error ? (
              <div className="text-red-400 text-sm p-3 bg-red-950/30 rounded">
                Error: {error}
              </div>
            ) : svg ? (
              <div
                ref={containerRef}
                className="flex justify-center [&_svg]:max-w-full"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <div className="text-purple-400/60 text-center py-8">
                Click Edit to add diagram code
              </div>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const MermaidBlock = Node.create({
  name: 'mermaidBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      code: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mermaid-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mermaid-block' })]
  },

  addNodeView() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ReactNodeViewRenderer(MermaidBlockComponent as any)
  },
})
