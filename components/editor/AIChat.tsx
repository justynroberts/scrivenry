'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import {
  MessageSquare,
  Send,
  Loader2,
  X,
  Sparkles,
  Copy,
  Check,
  FileText,
  Table,
  List,
  AlertCircle,
  Settings,
  RefreshCw,
  Trash2,
  Download,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getAISettings, AI_PROMPTS } from '@/lib/ai/providers'
import { fetchWithRetry } from '@/lib/api/fetch-with-retry'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface AIChatProps {
  editor: Editor | null
  pageContent?: string
  isOpen: boolean
  onClose: () => void
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  feedback?: 'up' | 'down' | null
  usage?: {
    inputTokens?: number
    outputTokens?: number
  }
}

const quickActions = [
  { id: 'summarize', label: 'Summarize this page', icon: FileText },
  { id: 'table', label: 'Generate a table', icon: Table },
  { id: 'list', label: 'Generate a list', icon: List },
]

// Feature 10: Suggested follow-up prompts based on context
const suggestedPrompts = [
  'Explain this in simpler terms',
  'Give me an example',
  'What are the alternatives?',
  'How can I improve this?',
]

export function AIChat({ editor, pageContent, isOpen, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [collapsedCodeBlocks, setCollapsedCodeBlocks] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const settings = getAISettings()

  // Feature 5: Format timestamp
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const sendMessage = async (content: string, replaceLastAssistant = false) => {
    if (!content.trim()) return

    const settings = getAISettings()
    if (!settings) {
      setError('AI not configured. Go to Settings > AI to set up.')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    // If replacing (regenerate or edit), remove the last assistant message
    if (replaceLastAssistant) {
      setMessages((prev) => {
        const filtered = prev.filter((m, i) => !(m.role === 'assistant' && i === prev.length - 1))
        // For edit, also update the user message
        if (editingMessageId) {
          return filtered.map((m) =>
            m.id === editingMessageId ? { ...m, content: content.trim() } : m
          )
        }
        return filtered
      })
    } else {
      setMessages((prev) => [...prev, userMessage])
    }

    setInput('')
    setEditingMessageId(null)
    setEditContent('')
    setLoading(true)
    setError('')

    try {
      const systemPrompt = pageContent
        ? `You are an AI assistant helping with a document. Here is the current page content for context:\n\n${pageContent}\n\nAnswer questions and help with writing tasks based on this context when relevant. Use markdown formatting in your responses.`
        : 'You are an AI assistant helping with writing and documentation. Be helpful, clear, and concise. Use markdown formatting in your responses.'

      const currentMessages = replaceLastAssistant && editingMessageId
        ? messages.filter((m) => m.id !== editingMessageId).map((m) => ({ role: m.role, content: m.content }))
        : messages.map((m) => ({ role: m.role, content: m.content }))

      const response = await fetchWithRetry('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...currentMessages,
            { role: 'user', content: content.trim() },
          ],
          settings,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'AI request failed')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        feedback: null,
        usage: data.usage,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed')
    } finally {
      setLoading(false)
    }
  }

  // Feature 2: Regenerate last response
  const regenerateLastResponse = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUserMessage) {
      sendMessage(lastUserMessage.content, true)
    }
  }

  // Feature 3: Clear conversation
  const clearConversation = () => {
    setMessages([])
    setError('')
  }

  // Feature 4: Export chat as markdown
  const exportChat = () => {
    const markdown = messages
      .map((m) => {
        const time = formatTimestamp(m.timestamp)
        const role = m.role === 'user' ? 'You' : 'AI'
        return `### ${role} (${time})\n\n${m.content}\n`
      })
      .join('\n---\n\n')

    const blob = new Blob([`# AI Chat Export\n\n${markdown}`], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-chat-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Feature 7: Feedback on responses
  const setFeedback = (messageId: string, feedback: 'up' | 'down') => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, feedback: m.feedback === feedback ? null : feedback }
          : m
      )
    )
  }

  // Feature 8: Start editing a user message
  const startEditing = (message: Message) => {
    setEditingMessageId(message.id)
    setEditContent(message.content)
    inputRef.current?.focus()
  }

  // Feature 8: Submit edited message
  const submitEdit = () => {
    if (editContent.trim() && editingMessageId) {
      sendMessage(editContent, true)
    }
  }

  // Feature 9: Toggle code block collapse
  const toggleCodeCollapse = (codeId: string) => {
    setCollapsedCodeBlocks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(codeId)) {
        newSet.delete(codeId)
      } else {
        newSet.add(codeId)
      }
      return newSet
    })
  }

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'summarize':
        sendMessage('Summarize the content of this page in a few bullet points.')
        break
      case 'table':
        sendMessage('Generate a useful table based on the content of this page.')
        break
      case 'list':
        sendMessage('Generate a structured list of the key points from this page.')
        break
    }
  }

  const insertToEditor = (content: string) => {
    if (!editor) return
    editor.chain().focus().insertContent(content).run()
  }

  const copyToClipboard = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  // Feature 1: Copy code to clipboard
  const copyCodeToClipboard = (code: string, codeId: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(codeId)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (editingMessageId) {
        submitEdit()
      } else {
        sendMessage(input)
      }
    }
    if (e.key === 'Escape' && editingMessageId) {
      setEditingMessageId(null)
      setEditContent('')
    }
  }

  // Feature 10: Handle suggested prompt click
  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage(prompt)
  }

  if (!isOpen) return null

  // Code block counter for unique IDs
  let codeBlockCounter = 0

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] bg-background border-l shadow-lg flex flex-col z-50">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-medium">AI Chat</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Feature 2: Regenerate button */}
          {messages.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={regenerateLastResponse}
              disabled={loading}
              title="Regenerate last response"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          {/* Feature 4: Export button */}
          {messages.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={exportChat}
              title="Export chat as markdown"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          {/* Feature 3: Clear button */}
          {messages.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearConversation}
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Not Configured Warning */}
      {!settings && (
        <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/20">
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-500 font-medium">AI not configured</p>
              <p className="text-muted-foreground mt-1">
                Set up an AI provider to use this feature.
              </p>
              <Link
                href="/settings/ai"
                className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
              >
                <Settings className="h-3 w-3" />
                Go to AI Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && settings && (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Ask questions about your page or get help with writing
            </p>
            <div className="space-y-2">
              {quickActions.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleQuickAction(id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border hover:bg-muted transition-colors"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex flex-col',
              message.role === 'user' ? 'items-end' : 'items-start'
            )}
          >
            {/* Feature 5: Timestamp */}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
              {formatTimestamp(message.timestamp)}
            </div>
            <div
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2 text-sm relative group',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              {message.role === 'user' ? (
                <>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {/* Feature 8: Edit button for user messages */}
                  <button
                    onClick={() => startEditing(message)}
                    className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground transition-opacity"
                    title="Edit message"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        const isInline = !match && !String(children).includes('\n')
                        const codeContent = String(children).replace(/\n$/, '')
                        const codeId = `code-${message.id}-${codeBlockCounter++}`
                        const isCollapsed = collapsedCodeBlocks.has(codeId)
                        const lineCount = codeContent.split('\n').length

                        if (isInline) {
                          return (
                            <code className="bg-background/50 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                              {children}
                            </code>
                          )
                        }

                        return (
                          <div className="relative group/code my-2">
                            {/* Feature 1: Copy code button */}
                            <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover/code:opacity-100 transition-opacity z-10">
                              <button
                                onClick={() => copyCodeToClipboard(codeContent, codeId)}
                                className="p-1 bg-background/80 hover:bg-background rounded text-xs"
                                title="Copy code"
                              >
                                {copiedCode === codeId ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                              {/* Feature 9: Collapse button for long code */}
                              {lineCount > 10 && (
                                <button
                                  onClick={() => toggleCodeCollapse(codeId)}
                                  className="p-1 bg-background/80 hover:bg-background rounded text-xs"
                                  title={isCollapsed ? 'Expand code' : 'Collapse code'}
                                >
                                  {isCollapsed ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronUp className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </div>
                            <div className={cn(
                              'overflow-hidden transition-all',
                              isCollapsed && lineCount > 10 ? 'max-h-[100px]' : 'max-h-none'
                            )}>
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match ? match[1] : 'text'}
                                PreTag="div"
                                className="rounded-md text-xs"
                                customStyle={{ margin: 0, padding: '0.75rem' }}
                              >
                                {codeContent}
                              </SyntaxHighlighter>
                            </div>
                            {isCollapsed && lineCount > 10 && (
                              <div
                                className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted to-transparent cursor-pointer flex items-end justify-center pb-1"
                                onClick={() => toggleCodeCollapse(codeId)}
                              >
                                <span className="text-[10px] text-muted-foreground">
                                  {lineCount} lines - Click to expand
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      },
                      p({ children }) {
                        return <p className="mb-2 last:mb-0">{children}</p>
                      },
                      ul({ children }) {
                        return <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
                      },
                      ol({ children }) {
                        return <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
                      },
                      li({ children }) {
                        return <li className="text-sm">{children}</li>
                      },
                      h1({ children }) {
                        return <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>
                      },
                      h2({ children }) {
                        return <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>
                      },
                      h3({ children }) {
                        return <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h3>
                      },
                      blockquote({ children }) {
                        return <blockquote className="border-l-2 border-primary pl-3 italic my-2">{children}</blockquote>
                      },
                      table({ children }) {
                        return <table className="border-collapse w-full my-2 text-xs">{children}</table>
                      },
                      th({ children }) {
                        return <th className="border border-border px-2 py-1 bg-background/50 font-medium text-left">{children}</th>
                      },
                      td({ children }) {
                        return <td className="border border-border px-2 py-1">{children}</td>
                      },
                      a({ href, children }) {
                        return <a href={href} className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">{children}</a>
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            {/* Actions for assistant messages */}
            {message.role === 'assistant' && (
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => copyToClipboard(message.content, message.id)}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                  title="Copy"
                >
                  {copied === message.id ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={() => insertToEditor(message.content)}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground text-xs"
                  title="Insert into page"
                >
                  Insert
                </button>
                {/* Feature 7: Thumbs up/down feedback */}
                <button
                  onClick={() => setFeedback(message.id, 'up')}
                  className={cn(
                    'p-1 hover:bg-muted rounded transition-colors',
                    message.feedback === 'up'
                      ? 'text-green-500'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Good response"
                >
                  <ThumbsUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setFeedback(message.id, 'down')}
                  className={cn(
                    'p-1 hover:bg-muted rounded transition-colors',
                    message.feedback === 'down'
                      ? 'text-red-500'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Poor response"
                >
                  <ThumbsDown className="h-3 w-3" />
                </button>
                {/* Feature 6: Token usage display */}
                {message.usage && (message.usage.inputTokens || message.usage.outputTokens) && (
                  <span className="text-[10px] text-muted-foreground ml-2 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {message.usage.inputTokens || 0}/{message.usage.outputTokens || 0} tokens
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-2 text-sm text-red-500 bg-red-500/10 rounded">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Feature 10: Suggested follow-up prompts */}
        {messages.length > 0 && !loading && settings && (
          <div className="pt-2">
            <p className="text-[10px] text-muted-foreground mb-2">Suggested follow-ups:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="text-xs px-2 py-1 rounded-full border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        {/* Feature 8: Edit mode indicator */}
        {editingMessageId && (
          <div className="flex items-center justify-between mb-2 px-2 py-1 bg-primary/10 rounded text-xs">
            <span className="text-primary">Editing message...</span>
            <button
              onClick={() => {
                setEditingMessageId(null)
                setEditContent('')
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={editingMessageId ? editContent : input}
            onChange={(e) =>
              editingMessageId
                ? setEditContent(e.target.value)
                : setInput(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder={editingMessageId ? 'Edit your message...' : 'Ask anything...'}
            rows={2}
            disabled={!settings || loading}
            className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <Button
            onClick={() => (editingMessageId ? submitEdit() : sendMessage(input))}
            disabled={
              !(editingMessageId ? editContent.trim() : input.trim()) ||
              !settings ||
              loading
            }
            size="sm"
            className="self-end"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
          {editingMessageId && ', Escape to cancel'}
        </p>
      </div>
    </div>
  )
}
