'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState, useCallback, useEffect } from 'react'
import { Code2, Play, Trash2, Copy, Check, RotateCcw, Terminal, Eye, EyeOff, Sparkles, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeExecutionResult {
  success: boolean
  logs: string[]
  result?: string | null
  error?: string
}

interface JavaScriptBlockComponentProps {
  node: {
    attrs: {
      code?: string | null
      output?: string | null
      error?: string | null
      autoRun?: boolean
      showOutput?: boolean
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  deleteNode: () => void
}

const JavaScriptBlockComponent = ({ node, updateAttributes, deleteNode }: JavaScriptBlockComponentProps) => {
  const { code, output, error, autoRun, showOutput } = node.attrs
  const [isEditing, setIsEditing] = useState(!code)
  const [input, setInput] = useState(code || '')
  const [currentOutput, setCurrentOutput] = useState(output || '')
  const [currentError, setCurrentError] = useState(error || '')
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showAiPrompt, setShowAiPrompt] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const generateCode = useCallback(async () => {
    if (!aiPrompt.trim()) return

    setIsGenerating(true)
    try {
      // Get AI settings from localStorage or use defaults
      const storedSettings = typeof window !== 'undefined' ? localStorage.getItem('ai-settings') : null
      const settings = storedSettings ? JSON.parse(storedSettings) : {
        provider: 'ollama',
        apiKey: '',
        endpoint: 'http://localhost:11434',
        model: 'llama3.2'
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a JavaScript code generator. Generate only valid JavaScript code based on the user\'s request. Do not include markdown code blocks or explanations - return ONLY the raw JavaScript code that can be executed directly. Keep the code concise and functional.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          settings
        })
      })

      if (response.ok) {
        const data = await response.json()
        const generatedCode = data.content || data.message || ''
        // Clean up any markdown code blocks if present
        const cleanCode = generatedCode
          .replace(/^```javascript\n?/i, '')
          .replace(/^```js\n?/i, '')
          .replace(/^```\n?/, '')
          .replace(/\n?```$/, '')
          .trim()

        setInput(prev => prev ? prev + '\n\n' + cleanCode : cleanCode)
        setShowAiPrompt(false)
        setAiPrompt('')
        setIsEditing(true)
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || 'AI generation failed'
        setAiPrompt(`Error: ${errorMsg}. Configure AI in Settings > AI.`)
      }
    } catch (err) {
      console.error('AI generation error:', err)
      setAiPrompt('Error: Could not connect to AI. Check settings.')
    } finally {
      setIsGenerating(false)
    }
  }, [aiPrompt])

  // Run code in sandboxed iframe using srcdoc and postMessage
  const runCode = useCallback(() => {
    if (!input.trim()) return

    setIsRunning(true)
    setCurrentOutput('')
    setCurrentError('')

    // Create sandboxed execution environment with srcdoc
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.sandbox.add('allow-scripts')

    // Create HTML that will execute the code and post results back
    const escapedInput = input.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
    const srcdoc = `
      <!DOCTYPE html>
      <html>
      <head><script>
        const __logs = [];
        const __originalConsole = console;
        console = {
          log: (...args) => __logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
          error: (...args) => __logs.push('ERROR: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
          warn: (...args) => __logs.push('WARN: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
          info: (...args) => __logs.push('INFO: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
          table: (data) => __logs.push(JSON.stringify(data, null, 2)),
          clear: () => {},
        };
        try {
          const __result = (function() {
            ${escapedInput}
          })();
          parent.postMessage({
            type: 'js-result',
            success: true,
            logs: __logs,
            result: __result !== undefined ? (typeof __result === 'object' ? JSON.stringify(__result, null, 2) : String(__result)) : null
          }, '*');
        } catch (e) {
          parent.postMessage({
            type: 'js-result',
            success: false,
            logs: __logs,
            error: e.message || String(e)
          }, '*');
        }
      </script></head>
      <body></body>
      </html>
    `

    // Set up message handler
    let timeoutId: NodeJS.Timeout
    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'js-result') {
        clearTimeout(timeoutId)
        window.removeEventListener('message', messageHandler)

        const result = event.data as CodeExecutionResult
        if (result.success) {
          let outputLines = [...result.logs]
          if (result.result !== null) {
            outputLines.push(`=> ${result.result}`)
          }
          const finalOutput = outputLines.join('\n')
          setCurrentOutput(finalOutput)
          updateAttributes({ output: finalOutput, error: null })
        } else {
          const errorMessage = result.error || 'Unknown error'
          setCurrentError(errorMessage)
          if (result.logs.length > 0) {
            setCurrentOutput(result.logs.join('\n'))
          }
          updateAttributes({ output: result.logs.join('\n'), error: errorMessage })
        }

        setIsRunning(false)
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }
    }

    window.addEventListener('message', messageHandler)

    // Set timeout
    timeoutId = setTimeout(() => {
      window.removeEventListener('message', messageHandler)
      setCurrentError('Execution timeout (5s)')
      setIsRunning(false)
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }, 5000)

    // Set srcdoc to trigger execution
    iframe.srcdoc = srcdoc
    document.body.appendChild(iframe)
  }, [input, updateAttributes])

  // Auto-run on mount if enabled and has code
  useEffect(() => {
    if (autoRun && code && !output && !error) {
      runCode()
    }
  }, [])

  const handleSave = () => {
    updateAttributes({ code: input })
    setIsEditing(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(input)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClear = () => {
    setCurrentOutput('')
    setCurrentError('')
    updateAttributes({ output: null, error: null })
  }

  if (!code && !isEditing) {
    return (
      <NodeViewWrapper>
        <div
          className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-border my-2 bg-accent/20 transition-colors"
          contentEditable={false}
          data-testid="js-placeholder"
        >
          <Code2 className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Add JavaScript code</p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="text-xs"
            >
              <Code2 className="h-3 w-3 mr-1" />
              Write code
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setIsEditing(true); setShowAiPrompt(true); }}
              className="text-xs text-purple-400 border-purple-500/50 hover:bg-purple-500/10"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AI Generate
            </Button>
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  if (isEditing) {
    return (
      <NodeViewWrapper>
        <div
          className="rounded-lg border border-border my-2 bg-card overflow-hidden"
          contentEditable={false}
          data-testid="js-editor"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">JavaScript</span>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => setShowAiPrompt(!showAiPrompt)} title="AI Generate" className="text-purple-400 hover:text-purple-300">
                <Sparkles className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCopy} title="Copy code">
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={deleteNode} title="Delete block">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* AI Prompt */}
          {showAiPrompt && (
            <div className="px-3 py-2 bg-purple-950/30 border-b border-purple-500/30">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400 flex-shrink-0" />
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && generateCode()}
                  placeholder="Describe what code you want to generate..."
                  className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={generateCode}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="text-purple-400 hover:text-purple-300"
                >
                  {isGenerating ? (
                    <div className="h-3 w-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAiPrompt(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Code editor */}
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="// Write your JavaScript code here...&#10;console.log('Hello, World!');"
              className="w-full px-4 py-3 bg-[#282c34] text-gray-100 text-sm font-mono min-h-[120px] resize-y focus:outline-none"
              spellCheck={false}
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-t">
            <Button size="sm" onClick={() => { handleSave(); runCode(); }} className="bg-green-600 hover:bg-green-700">
              <Play className="h-3 w-3 mr-1" />
              Run
            </Button>
            <Button size="sm" variant="outline" onClick={handleSave}>
              <Check className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setInput(code || '') }}>
              Cancel
            </Button>
            <label className="flex items-center gap-2 ml-auto text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={autoRun || false}
                onChange={(e) => updateAttributes({ autoRun: e.target.checked })}
                className="rounded"
              />
              Auto-run on load
            </label>
          </div>

          {/* Output preview */}
          {(currentOutput || currentError) && (
            <div className="border-t">
              <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 text-xs text-muted-foreground">
                <Terminal className="h-3 w-3" />
                Output
              </div>
              <pre className={`px-4 py-2 text-xs font-mono max-h-[200px] overflow-auto ${currentError ? 'bg-red-950/30 text-red-400' : 'bg-[#1e1e1e] text-gray-300'}`}>
                {currentOutput}
                {currentError && <div className="text-red-400 mt-1">Error: {currentError}</div>}
              </pre>
            </div>
          )}
        </div>
      </NodeViewWrapper>
    )
  }

  // Display mode
  return (
    <NodeViewWrapper>
      <div
        className="group rounded-lg border border-border my-2 bg-card overflow-hidden"
        contentEditable={false}
        data-testid="js-block"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">JavaScript</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" onClick={runCode} disabled={isRunning} title="Run code">
              {isRunning ? (
                <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="h-3 w-3 text-green-500" />
              )}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setIsEditing(true); setShowAiPrompt(true); }} title="AI Generate" className="text-purple-400 hover:text-purple-300">
              <Sparkles className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} title="Edit code">
              <Code2 className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCopy} title="Copy code">
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateAttributes({ showOutput: !showOutput })}
              title={showOutput ? 'Hide output' : 'Show output'}
            >
              {showOutput ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClear} title="Clear output">
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={deleteNode} title="Delete block">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Code display */}
        <div className="relative" onClick={() => setIsEditing(true)}>
          <SyntaxHighlighter
            language="javascript"
            style={oneDark}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.75rem',
              maxHeight: '300px',
              overflow: 'auto',
            }}
          >
            {code || ''}
          </SyntaxHighlighter>
        </div>

        {/* Output */}
        {(showOutput !== false) && (currentOutput || currentError || output || error) && (
          <div className="border-t">
            <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 text-xs text-muted-foreground">
              <Terminal className="h-3 w-3" />
              Output
            </div>
            <pre className={`px-4 py-2 text-xs font-mono max-h-[200px] overflow-auto ${(currentError || error) ? 'bg-red-950/30 text-red-400' : 'bg-[#1e1e1e] text-gray-300'}`}>
              {currentOutput || output || ''}
              {(currentError || error) && <div className="text-red-400 mt-1">Error: {currentError || error}</div>}
            </pre>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const JavaScriptBlock = Node.create({
  name: 'javascriptBlock',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      code: {
        default: null,
      },
      output: {
        default: null,
      },
      error: {
        default: null,
      },
      autoRun: {
        default: false,
      },
      showOutput: {
        default: true,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="javascript-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'javascript-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(JavaScriptBlockComponent)
  },
})
