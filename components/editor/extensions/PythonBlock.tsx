'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { Code2, Play, Trash2, Copy, Check, RotateCcw, Terminal, Eye, EyeOff, Sparkles, X, Send, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface PythonBlockComponentProps {
  node: {
    attrs: {
      code?: string | null
      output?: string | null
      error?: string | null
      showOutput?: boolean
      packages?: string | null
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  deleteNode: () => void
}

// Load Pyodide for Python execution
let pyodidePromise: Promise<unknown> | null = null

const loadPyodide = async () => {
  if (pyodidePromise) return pyodidePromise

  pyodidePromise = new Promise(async (resolve, reject) => {
    try {
      // Load Pyodide script
      if (!(window as unknown as { loadPyodide?: unknown }).loadPyodide) {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
        script.async = true
        await new Promise<void>((res, rej) => {
          script.onload = () => res()
          script.onerror = () => rej(new Error('Failed to load Pyodide'))
          document.head.appendChild(script)
        })
      }

      const pyodide = await (window as unknown as { loadPyodide: (options: { indexURL: string }) => Promise<unknown> }).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
      })
      resolve(pyodide)
    } catch (err) {
      pyodidePromise = null
      reject(err)
    }
  })

  return pyodidePromise
}

const PythonBlockComponent = ({ node, updateAttributes, deleteNode }: PythonBlockComponentProps) => {
  const { code, output, error, showOutput, packages } = node.attrs
  const [isEditing, setIsEditing] = useState(!code)
  const [input, setInput] = useState(code || '')
  const [currentOutput, setCurrentOutput] = useState(output || '')
  const [currentError, setCurrentError] = useState(error || '')
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showAiPrompt, setShowAiPrompt] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(false)
  const [showPackages, setShowPackages] = useState(false)
  const [packagesInput, setPackagesInput] = useState(packages || '')
  const [installingPackages, setInstallingPackages] = useState(false)
  const pyodideRef = useRef<unknown>(null)
  const installedPackagesRef = useRef<Set<string>>(new Set())

  const generateCode = useCallback(async () => {
    if (!aiPrompt.trim()) return

    setIsGenerating(true)
    try {
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
              content: 'You are a Python code generator. Generate only valid Python code based on the user\'s request. Do not include markdown code blocks or explanations - return ONLY the raw Python code that can be executed directly. Keep the code concise and functional. Use print() for output.'
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
        const cleanCode = generatedCode
          .replace(/^```python\n?/i, '')
          .replace(/^```py\n?/i, '')
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

  const installPackages = useCallback(async (pyodide: unknown, packageList: string[]) => {
    if (packageList.length === 0) return

    const py = pyodide as {
      runPythonAsync: (code: string) => Promise<unknown>
      loadPackage: (pkg: string | string[]) => Promise<void>
    }

    // Filter out already installed packages
    const toInstall = packageList.filter(pkg => !installedPackagesRef.current.has(pkg))
    if (toInstall.length === 0) return

    setInstallingPackages(true)
    setCurrentOutput(prev => prev + `Installing packages: ${toInstall.join(', ')}...\n`)

    try {
      // Load micropip first
      await py.loadPackage('micropip')

      // Install each package via micropip
      for (const pkg of toInstall) {
        await py.runPythonAsync(`
import micropip
await micropip.install('${pkg}')
`)
        installedPackagesRef.current.add(pkg)
      }
      setCurrentOutput(prev => prev + `Packages installed successfully.\n\n`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setCurrentOutput(prev => prev + `Package installation warning: ${errorMessage}\n\n`)
    } finally {
      setInstallingPackages(false)
    }
  }, [])

  const runCode = useCallback(async () => {
    if (!input.trim()) return

    setIsRunning(true)
    setCurrentOutput('')
    setCurrentError('')
    setPyodideLoading(true)

    try {
      // Load Pyodide if not loaded
      if (!pyodideRef.current) {
        pyodideRef.current = await loadPyodide()
      }
      setPyodideLoading(false)

      const pyodide = pyodideRef.current as {
        runPythonAsync: (code: string) => Promise<unknown>
        setStdout: (opts: { batched: (text: string) => void }) => void
        setStderr: (opts: { batched: (text: string) => void }) => void
        loadPackage: (pkg: string | string[]) => Promise<void>
      }

      // Install packages if specified
      if (packagesInput.trim()) {
        const packageList = packagesInput.split(/[,\s]+/).map(p => p.trim()).filter(Boolean)
        await installPackages(pyodide, packageList)
      }

      // Capture stdout
      let outputLines: string[] = []
      pyodide.setStdout({
        batched: (text: string) => {
          outputLines.push(text)
        }
      })
      pyodide.setStderr({
        batched: (text: string) => {
          outputLines.push(`[stderr] ${text}`)
        }
      })

      // Run the code
      const result = await pyodide.runPythonAsync(input)

      // Combine output
      let finalOutput = outputLines.join('')
      if (result !== undefined && result !== null) {
        finalOutput += (finalOutput ? '\n' : '') + `=> ${result}`
      }

      setCurrentOutput(prev => prev + finalOutput)
      updateAttributes({ output: finalOutput, error: null, packages: packagesInput })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setCurrentError(errorMessage)
      updateAttributes({ output: '', error: errorMessage, packages: packagesInput })
    } finally {
      setIsRunning(false)
      setPyodideLoading(false)
    }
  }, [input, packagesInput, updateAttributes, installPackages])

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
          data-testid="python-placeholder"
        >
          <Code2 className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Add Python code</p>
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
          data-testid="python-editor"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Python</span>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => setShowPackages(!showPackages)} title="Manage packages" className={packagesInput ? 'text-green-400 hover:text-green-300' : 'text-muted-foreground hover:text-foreground'}>
                <Package className="h-3 w-3" />
              </Button>
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

          {/* Packages Input */}
          {showPackages && (
            <div className="px-3 py-2 bg-green-950/30 border-b border-green-500/30">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-green-400 flex-shrink-0" />
                <input
                  type="text"
                  value={packagesInput}
                  onChange={(e) => setPackagesInput(e.target.value)}
                  placeholder="numpy, pandas, requests (comma or space separated)"
                  className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={() => setShowPackages(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-green-400/70 mt-1 ml-6">
                Packages will be installed via micropip when you run the code
              </p>
            </div>
          )}

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
                  placeholder="Describe what Python code you want..."
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
              placeholder="# Write your Python code here...&#10;print('Hello, World!')"
              className="w-full px-4 py-3 bg-[#282c34] text-gray-100 text-sm font-mono min-h-[120px] resize-y focus:outline-none"
              spellCheck={false}
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-t">
            <Button size="sm" onClick={() => { handleSave(); runCode(); }} className="bg-blue-600 hover:bg-blue-700">
              <Play className="h-3 w-3 mr-1" />
              {pyodideLoading ? 'Loading...' : 'Run'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleSave}>
              <Check className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setInput(code || '') }}>
              Cancel
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              Powered by Pyodide
            </span>
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
        data-testid="python-block"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Python</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" onClick={runCode} disabled={isRunning} title="Run code">
              {isRunning ? (
                <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="h-3 w-3 text-blue-500" />
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
            language="python"
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

export const PythonBlock = Node.create({
  name: 'pythonBlock',

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
      showOutput: {
        default: true,
      },
      packages: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="python-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'python-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(PythonBlockComponent)
  },
})
