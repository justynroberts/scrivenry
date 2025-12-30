'use client'

import { useState, useEffect, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import {
  Sparkles,
  Wand2,
  Expand,
  Minimize2,
  Languages,
  Check,
  RefreshCw,
  Type,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getAISettings, AI_PROMPTS } from '@/lib/ai/providers'
import { fetchWithRetry } from '@/lib/api/fetch-with-retry'

interface AIWritingAssistantProps {
  editor: Editor | null
}

type AIAction = 'improve' | 'expand' | 'summarize' | 'simplify' | 'longer' | 'shorter' | 'grammar' | 'translate'

interface ActionConfig {
  id: AIAction
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const actions: ActionConfig[] = [
  { id: 'improve', label: 'Improve', icon: Wand2, description: 'Make it clearer and more professional' },
  { id: 'expand', label: 'Expand', icon: Expand, description: 'Add more detail and depth' },
  { id: 'summarize', label: 'Summarize', icon: Minimize2, description: 'Create a concise summary' },
  { id: 'simplify', label: 'Simplify', icon: Type, description: 'Make it easier to understand' },
  { id: 'longer', label: 'Make Longer', icon: Expand, description: 'Add relevant details' },
  { id: 'shorter', label: 'Make Shorter', icon: Minimize2, description: 'Keep only key points' },
  { id: 'grammar', label: 'Fix Grammar', icon: Check, description: 'Fix spelling and grammar' },
  { id: 'translate', label: 'Translate', icon: Languages, description: 'Translate to another language' },
]

const languages = ['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Chinese', 'Korean']

export function AIWritingAssistant({ editor }: AIWritingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [showTranslateMenu, setShowTranslateMenu] = useState(false)

  // Open via keyboard shortcut only (Cmd+J / Ctrl+J)
  const openAssistant = useCallback(() => {
    if (!editor) return

    const { from, to, empty } = editor.state.selection
    if (empty) return

    const text = editor.state.doc.textBetween(from, to, ' ')
    if (text.length < 3) return

    setSelectedText(text)

    // Get position from the editor's view
    const coords = editor.view.coordsAtPos(from)
    const editorRect = editor.view.dom.getBoundingClientRect()

    setPosition({
      top: coords.top - editorRect.top - 50,
      left: coords.left - editorRect.left,
    })

    setIsOpen(true)
  }, [editor])

  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+J / Ctrl+J to open AI assistant
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        openAssistant()
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setResult('')
        setError('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editor, openAssistant, isOpen])

  const executeAction = async (action: AIAction, language?: string) => {
    const settings = getAISettings()
    if (!settings) {
      setError('AI not configured. Go to Settings > AI to set up.')
      return
    }

    setLoading(true)
    setResult('')
    setError('')
    setShowTranslateMenu(false)

    try {
      let prompt: string
      switch (action) {
        case 'improve':
          prompt = AI_PROMPTS.improve(selectedText)
          break
        case 'expand':
          prompt = AI_PROMPTS.expand(selectedText)
          break
        case 'summarize':
          prompt = AI_PROMPTS.summarize(selectedText)
          break
        case 'simplify':
          prompt = AI_PROMPTS.simplify(selectedText)
          break
        case 'longer':
          prompt = AI_PROMPTS.makeLonger(selectedText)
          break
        case 'shorter':
          prompt = AI_PROMPTS.makeShorter(selectedText)
          break
        case 'grammar':
          prompt = AI_PROMPTS.fixGrammar(selectedText)
          break
        case 'translate':
          prompt = AI_PROMPTS.translate(selectedText, language || 'Spanish')
          break
        default:
          prompt = AI_PROMPTS.improve(selectedText)
      }

      const response = await fetchWithRetry('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          settings,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'AI request failed')
      }

      const data = await response.json()
      setResult(data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed')
    } finally {
      setLoading(false)
    }
  }

  const applyResult = () => {
    if (!editor || !result) return

    const { from, to } = editor.state.selection
    editor.chain().focus().deleteRange({ from, to }).insertContent(result).run()

    setIsOpen(false)
    setResult('')
  }

  const regenerate = () => {
    // Re-run the last action
    executeAction('improve')
  }

  if (!isOpen) return null

  return (
    <div
      className="absolute z-50 bg-popover border rounded-lg shadow-lg p-2 min-w-[280px] max-w-[400px]"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          AI Assistant
        </div>
        <button
          onClick={() => {
            setIsOpen(false)
            setResult('')
            setError('')
          }}
          className="p-1 hover:bg-muted rounded"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Generating...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-500 bg-red-500/10 rounded">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result State */}
      {result && !loading && (
        <div className="space-y-2">
          <div className="max-h-[200px] overflow-y-auto p-2 bg-muted/50 rounded text-sm">
            {result}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={applyResult} className="flex-1">
              <Check className="h-3 w-3 mr-1" />
              Replace
            </Button>
            <Button size="sm" variant="outline" onClick={regenerate}>
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setResult('')
                setError('')
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Actions Menu */}
      {!loading && !result && (
        <div className="space-y-1">
          {actions.map(({ id, label, icon: Icon }) => (
            <div key={id}>
              {id === 'translate' ? (
                <div className="relative">
                  <button
                    onClick={() => setShowTranslateMenu(!showTranslateMenu)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors text-left',
                      showTranslateMenu && 'bg-muted'
                    )}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                  </button>
                  {showTranslateMenu && (
                    <div className="absolute left-full top-0 ml-1 bg-popover border rounded-lg shadow-lg p-1 min-w-[120px]">
                      {languages.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => executeAction('translate', lang)}
                          className="w-full px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors text-left"
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => executeAction(id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors text-left"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
