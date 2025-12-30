'use client'

import { BubbleMenu, Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Highlighter,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  RemoveFormatting,
  ChevronDown,
  Sparkles,
  Wand2,
  Expand,
  Minimize2,
  Languages,
  Check,
  Type,
  Loader2,
  X,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { getAISettings, AI_PROMPTS } from '@/lib/ai/providers'
import { fetchWithRetry } from '@/lib/api/fetch-with-retry'

type AIAction = 'improve' | 'expand' | 'summarize' | 'simplify' | 'longer' | 'shorter' | 'grammar' | 'translate'

const aiActions = [
  { id: 'improve' as AIAction, label: 'Improve', icon: Wand2 },
  { id: 'expand' as AIAction, label: 'Expand', icon: Expand },
  { id: 'summarize' as AIAction, label: 'Summarize', icon: Minimize2 },
  { id: 'simplify' as AIAction, label: 'Simplify', icon: Type },
  { id: 'grammar' as AIAction, label: 'Fix Grammar', icon: Check },
  { id: 'translate' as AIAction, label: 'Translate', icon: Languages },
]

const languages = ['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Chinese', 'Korean']

interface EditorBubbleMenuProps {
  editor: Editor
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', color: '#fef08a' },
  { name: 'Green', color: '#bbf7d0' },
  { name: 'Blue', color: '#bfdbfe' },
  { name: 'Pink', color: '#fbcfe8' },
  { name: 'Purple', color: '#ddd6fe' },
  { name: 'Orange', color: '#fed7aa' },
  { name: 'Red', color: '#fecaca' },
  { name: 'Gray', color: '#e5e7eb' },
]

const TEXT_COLORS = [
  { name: 'Default', color: null },
  { name: 'Gray', color: '#9ca3af' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Yellow', color: '#eab308' },
  { name: 'Green', color: '#22c55e' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#a855f7' },
  { name: 'Pink', color: '#ec4899' },
]

function ColorPicker({
  colors,
  onSelect,
  currentColor,
  onClose
}: {
  colors: { name: string; color: string | null }[]
  onSelect: (color: string | null) => void
  currentColor: string | null
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 p-2 bg-popover rounded-lg border shadow-lg z-50 grid grid-cols-3 gap-1 min-w-[120px]"
    >
      {colors.map((c) => (
        <button
          key={c.name}
          onClick={() => {
            onSelect(c.color)
            onClose()
          }}
          className={cn(
            'w-8 h-8 rounded border-2 transition-all hover:scale-110',
            currentColor === c.color ? 'border-primary' : 'border-transparent'
          )}
          style={{ backgroundColor: c.color || 'transparent' }}
          title={c.name}
        >
          {!c.color && <span className="text-xs">Aa</span>}
        </button>
      ))}
    </div>
  )
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showAIMenu, setShowAIMenu] = useState(false)
  const [showTranslateMenu, setShowTranslateMenu] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [aiError, setAiError] = useState('')
  const aiMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) {
        if (!aiLoading && !aiResult) {
          setShowAIMenu(false)
          setShowTranslateMenu(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [aiLoading, aiResult])

  const executeAIAction = async (action: AIAction, language?: string) => {
    const settings = getAISettings()
    if (!settings) {
      setAiError('AI not configured. Go to Settings > AI to set up.')
      return
    }

    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')
    if (!selectedText) return

    setAiLoading(true)
    setAiResult('')
    setAiError('')
    setShowTranslateMenu(false)

    try {
      let prompt: string
      switch (action) {
        case 'improve': prompt = AI_PROMPTS.improve(selectedText); break
        case 'expand': prompt = AI_PROMPTS.expand(selectedText); break
        case 'summarize': prompt = AI_PROMPTS.summarize(selectedText); break
        case 'simplify': prompt = AI_PROMPTS.simplify(selectedText); break
        case 'longer': prompt = AI_PROMPTS.makeLonger(selectedText); break
        case 'shorter': prompt = AI_PROMPTS.makeShorter(selectedText); break
        case 'grammar': prompt = AI_PROMPTS.fixGrammar(selectedText); break
        case 'translate': prompt = AI_PROMPTS.translate(selectedText, language || 'Spanish'); break
        default: prompt = AI_PROMPTS.improve(selectedText)
      }

      const response = await fetchWithRetry('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], settings }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'AI request failed')
      }

      const data = await response.json()
      setAiResult(data.content)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI request failed')
    } finally {
      setAiLoading(false)
    }
  }

  const applyAIResult = () => {
    if (!aiResult) return
    const { from, to } = editor.state.selection
    editor.chain().focus().deleteRange({ from, to }).insertContent(aiResult).run()
    setShowAIMenu(false)
    setAiResult('')
    setAiError('')
  }

  const closeAIMenu = () => {
    setShowAIMenu(false)
    setShowTranslateMenu(false)
    setAiResult('')
    setAiError('')
  }

  const formatItems = [
    {
      icon: Bold,
      title: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    },
    {
      icon: Italic,
      title: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
    },
    {
      icon: Underline,
      title: 'Underline',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive('underline'),
    },
    {
      icon: Strikethrough,
      title: 'Strikethrough',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike'),
    },
    {
      icon: Code,
      title: 'Code',
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive('code'),
    },
  ]

  const alignItems = [
    {
      icon: AlignLeft,
      title: 'Align Left',
      action: () => editor.chain().focus().setTextAlign('left').run(),
      isActive: () => editor.isActive({ textAlign: 'left' }),
    },
    {
      icon: AlignCenter,
      title: 'Align Center',
      action: () => editor.chain().focus().setTextAlign('center').run(),
      isActive: () => editor.isActive({ textAlign: 'center' }),
    },
    {
      icon: AlignRight,
      title: 'Align Right',
      action: () => editor.chain().focus().setTextAlign('right').run(),
      isActive: () => editor.isActive({ textAlign: 'right' }),
    },
    {
      icon: AlignJustify,
      title: 'Justify',
      action: () => editor.chain().focus().setTextAlign('justify').run(),
      isActive: () => editor.isActive({ textAlign: 'justify' }),
    },
  ]

  const handleLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const handleHighlight = (color: string | null) => {
    if (color) {
      editor.chain().focus().toggleHighlight({ color }).run()
    } else {
      editor.chain().focus().unsetHighlight().run()
    }
  }

  const handleTextColor = (color: string | null) => {
    if (color) {
      editor.chain().focus().setColor(color).run()
    } else {
      editor.chain().focus().unsetColor().run()
    }
  }

  const clearFormatting = () => {
    editor.chain().focus().clearNodes().unsetAllMarks().run()
  }

  const currentHighlight = editor.getAttributes('highlight').color
  const currentColor = editor.getAttributes('textStyle').color

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      className="flex items-center gap-0.5 p-1 rounded-lg border bg-popover shadow-lg"
    >
      {/* Format buttons */}
      {formatItems.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.title}
            onClick={item.action}
            className={cn(
              'p-1.5 rounded hover:bg-accent transition-colors',
              item.isActive() && 'bg-accent text-accent-foreground'
            )}
            title={item.title}
            type="button"
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}

      <div className="w-px h-5 bg-border mx-1" />

      {/* Highlight */}
      <div className="relative">
        <button
          onClick={() => {
            setShowHighlightPicker(!showHighlightPicker)
            setShowColorPicker(false)
          }}
          className={cn(
            'p-1.5 rounded hover:bg-accent transition-colors flex items-center gap-0.5',
            editor.isActive('highlight') && 'bg-accent'
          )}
          title="Highlight"
          type="button"
        >
          <Highlighter className="h-4 w-4" />
          <ChevronDown className="h-3 w-3" />
        </button>
        {showHighlightPicker && (
          <ColorPicker
            colors={[{ name: 'None', color: null }, ...HIGHLIGHT_COLORS]}
            onSelect={handleHighlight}
            currentColor={currentHighlight}
            onClose={() => setShowHighlightPicker(false)}
          />
        )}
      </div>

      {/* Text Color */}
      <div className="relative">
        <button
          onClick={() => {
            setShowColorPicker(!showColorPicker)
            setShowHighlightPicker(false)
          }}
          className={cn(
            'p-1.5 rounded hover:bg-accent transition-colors flex items-center gap-0.5',
            currentColor && 'bg-accent'
          )}
          title="Text Color"
          type="button"
        >
          <Palette className="h-4 w-4" style={{ color: currentColor || undefined }} />
          <ChevronDown className="h-3 w-3" />
        </button>
        {showColorPicker && (
          <ColorPicker
            colors={TEXT_COLORS}
            onSelect={handleTextColor}
            currentColor={currentColor}
            onClose={() => setShowColorPicker(false)}
          />
        )}
      </div>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Alignment */}
      {alignItems.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.title}
            onClick={item.action}
            className={cn(
              'p-1.5 rounded hover:bg-accent transition-colors',
              item.isActive() && 'bg-accent text-accent-foreground'
            )}
            title={item.title}
            type="button"
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}

      <div className="w-px h-5 bg-border mx-1" />

      {/* Link */}
      <button
        onClick={handleLink}
        className={cn(
          'p-1.5 rounded hover:bg-accent transition-colors',
          editor.isActive('link') && 'bg-accent text-accent-foreground'
        )}
        title="Link"
        type="button"
      >
        <Link className="h-4 w-4" />
      </button>

      {/* Clear Formatting */}
      <button
        onClick={clearFormatting}
        className="p-1.5 rounded hover:bg-accent transition-colors"
        title="Clear Formatting"
        type="button"
      >
        <RemoveFormatting className="h-4 w-4" />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* AI Button */}
      <div className="relative" ref={aiMenuRef}>
        <button
          onClick={() => {
            setShowAIMenu(!showAIMenu)
            setShowHighlightPicker(false)
            setShowColorPicker(false)
          }}
          className={cn(
            'p-1.5 rounded hover:bg-accent transition-colors flex items-center gap-0.5',
            showAIMenu && 'bg-accent'
          )}
          title="AI Assistant (select text first)"
          type="button"
        >
          <Sparkles className="h-4 w-4 text-violet-400" />
        </button>

        {showAIMenu && (
          <div className="absolute top-full right-0 mt-1 p-2 bg-popover rounded-lg border shadow-lg z-50 min-w-[200px]">
            {/* Loading */}
            {aiLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Generating...</span>
              </div>
            )}

            {/* Error */}
            {aiError && !aiLoading && (
              <div className="p-2 text-sm text-red-400 bg-red-500/10 rounded mb-2">
                {aiError}
              </div>
            )}

            {/* Result */}
            {aiResult && !aiLoading && (
              <div className="space-y-2">
                <div className="max-h-[150px] overflow-y-auto p-2 bg-muted/50 rounded text-sm">
                  {aiResult}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={applyAIResult}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    <Check className="h-3 w-3" />
                    Replace
                  </button>
                  <button
                    onClick={() => executeAIAction('improve')}
                    className="p-1.5 rounded hover:bg-muted"
                    title="Regenerate"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                  <button
                    onClick={closeAIMenu}
                    className="p-1.5 rounded hover:bg-muted"
                    title="Close"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            {!aiLoading && !aiResult && (
              <div className="space-y-0.5">
                <div className="px-2 py-1 text-xs text-muted-foreground font-medium">AI Actions</div>
                {aiActions.map(({ id, label, icon: Icon }) => (
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
                          <div className="absolute left-full top-0 ml-1 bg-popover border rounded-lg shadow-lg p-1 min-w-[100px]">
                            {languages.map((lang) => (
                              <button
                                key={lang}
                                onClick={() => executeAIAction('translate', lang)}
                                className="w-full px-2 py-1 text-sm rounded hover:bg-muted transition-colors text-left"
                              >
                                {lang}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => executeAIAction(id)}
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
        )}
      </div>
    </BubbleMenu>
  )
}
