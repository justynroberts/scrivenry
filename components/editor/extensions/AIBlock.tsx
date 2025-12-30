'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { Sparkles, Loader2, Check, X, RefreshCw, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAISettings, AI_PROMPTS } from '@/lib/ai/providers'
import { fetchWithRetry } from '@/lib/api/fetch-with-retry'

interface AIBlockComponentProps {
  node: {
    attrs: {
      prompt?: string
      result?: string
      status?: 'idle' | 'loading' | 'done' | 'error'
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  deleteNode: () => void
  editor: {
    chain: () => {
      focus: () => {
        insertContent: (content: string) => {
          run: () => void
        }
      }
    }
  }
}

const AIBlockComponent = ({ node, updateAttributes, deleteNode, editor }: AIBlockComponentProps) => {
  const [prompt, setPrompt] = useState(node.attrs.prompt || '')
  const [result, setResult] = useState(node.attrs.result || '')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    (node.attrs.status as 'idle' | 'loading' | 'done' | 'error') || 'idle'
  )
  const [error, setError] = useState('')

  const generate = async () => {
    if (!prompt.trim()) return

    const settings = getAISettings()
    if (!settings) {
      setError('AI not configured. Go to Settings > AI to set up.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError('')
    updateAttributes({ status: 'loading', prompt })

    try {
      const response = await fetchWithRetry('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: AI_PROMPTS.generateFromPrompt(prompt),
            },
          ],
          settings,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'AI request failed')
      }

      const data = await response.json()
      setResult(data.content)
      setStatus('done')
      updateAttributes({ result: data.content, status: 'done' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed')
      setStatus('error')
      updateAttributes({ status: 'error' })
    }
  }

  const insertAndDelete = () => {
    if (!result) return
    // Insert the result as regular content
    deleteNode()
    setTimeout(() => {
      editor.chain().focus().insertContent(result).run()
    }, 0)
  }

  const regenerate = () => {
    setResult('')
    setStatus('idle')
    updateAttributes({ result: '', status: 'idle' })
    generate()
  }

  return (
    <NodeViewWrapper>
      <div
        className="my-4 rounded-lg border border-primary/30 bg-primary/5 overflow-hidden"
        contentEditable={false}
        data-testid="ai-block"
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border-b border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">AI Generate</span>
          <Button size="sm" variant="ghost" onClick={deleteNode} className="ml-auto h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="p-4">
          {/* Input */}
          {status !== 'done' && (
            <div className="space-y-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to generate..."
                rows={3}
                disabled={status === 'loading'}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={generate}
                  disabled={!prompt.trim() || status === 'loading'}
                  size="sm"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
                {error && (
                  <span className="text-xs text-red-500">{error}</span>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {status === 'done' && result && (
            <div className="space-y-3">
              <div className="p-3 bg-background rounded-lg border text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {result}
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={insertAndDelete} size="sm">
                  <Check className="h-4 w-4 mr-2" />
                  Insert
                </Button>
                <Button onClick={regenerate} size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
                <Button onClick={deleteNode} size="sm" variant="ghost">
                  <X className="h-4 w-4 mr-2" />
                  Discard
                </Button>
              </div>
            </div>
          )}

          {/* Quick Prompts */}
          {status === 'idle' && !prompt && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Quick prompts:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Write an introduction paragraph',
                  'Create a bullet point list',
                  'Generate a summary',
                  'Write a conclusion',
                ].map((quickPrompt) => (
                  <button
                    key={quickPrompt}
                    onClick={() => setPrompt(quickPrompt)}
                    className="px-2 py-1 text-xs rounded border hover:bg-muted transition-colors"
                  >
                    {quickPrompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const AIBlock = Node.create({
  name: 'aiBlock',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      prompt: {
        default: '',
      },
      result: {
        default: '',
      },
      status: {
        default: 'idle',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="ai-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'ai-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AIBlockComponent)
  },
})
