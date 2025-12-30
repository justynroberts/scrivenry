'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bot, Key, Server, Cpu, Check, AlertCircle, Loader2, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AIProvider = 'anthropic' | 'ollama' | 'openai'

interface AISettings {
  provider: AIProvider
  apiKey: string
  endpoint: string
  model: string
}

interface ModelInfo {
  name: string
  size: number
  modified?: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

interface ProviderOption {
  value: AIProvider
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  requiresKey: boolean
  defaultEndpoint: string
  models: string[]
}

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISettings>({
    provider: 'anthropic',
    apiKey: '',
    endpoint: '',
    model: 'claude-sonnet-4-20250514',
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [testMessage, setTestMessage] = useState('')
  const [saved, setSaved] = useState(false)
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelsError, setModelsError] = useState('')

  const providers: ProviderOption[] = [
    {
      value: 'anthropic',
      label: 'Anthropic (Claude)',
      description: 'Claude AI models from Anthropic',
      icon: Sparkles,
      requiresKey: true,
      defaultEndpoint: 'https://api.anthropic.com',
      models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-3-5-haiku-20241022'],
    },
    {
      value: 'ollama',
      label: 'Ollama (Local)',
      description: 'Run AI models locally with Ollama',
      icon: Server,
      requiresKey: false,
      defaultEndpoint: 'http://localhost:11434',
      models: ['llama3.2', 'mistral', 'codellama', 'mixtral', 'phi3'],
    },
    {
      value: 'openai',
      label: 'OpenAI',
      description: 'GPT models from OpenAI',
      icon: Bot,
      requiresKey: true,
      defaultEndpoint: 'https://api.openai.com',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    },
  ]

  useEffect(() => {
    const saved = localStorage.getItem('ai-settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSettings(parsed)
      } catch (e) {
        console.error('Failed to load AI settings:', e)
      }
    }
  }, [])

  const currentProvider = providers.find(p => p.value === settings.provider)

  const fetchModels = useCallback(async (provider: AIProvider, endpoint: string, currentModel?: string) => {
    setLoadingModels(true)
    setModelsError('')

    try {
      const response = await fetch('/api/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, endpoint }),
      })

      const data = await response.json()

      if (data.success && data.models) {
        setAvailableModels(data.models)
        if (data.models.length > 0 && provider === 'ollama' && currentModel) {
          // Auto-select first model if current model not in list
          const modelNames = data.models.map((m: ModelInfo) => m.name)
          if (!modelNames.includes(currentModel)) {
            setSettings(prev => ({ ...prev, model: data.models[0].name }))
          }
        }
      } else {
        setModelsError(data.error || 'Failed to fetch models')
        // Fall back to static list
        const providerConfig = providers.find(p => p.value === provider)
        setAvailableModels(providerConfig?.models.map(m => ({ name: m, size: 0 })) || [])
      }
    } catch (error) {
      setModelsError(error instanceof Error ? error.message : 'Failed to fetch models')
      const providerConfig = providers.find(p => p.value === provider)
      setAvailableModels(providerConfig?.models.map(m => ({ name: m, size: 0 })) || [])
    } finally {
      setLoadingModels(false)
    }
  }, [providers])

  // Fetch models when provider or endpoint changes
  useEffect(() => {
    fetchModels(settings.provider, settings.endpoint || currentProvider?.defaultEndpoint || '', settings.model)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.provider, settings.endpoint, currentProvider?.defaultEndpoint])

  function selectProvider(provider: AIProvider) {
    const providerConfig = providers.find(p => p.value === provider)
    setSettings({
      ...settings,
      provider,
      endpoint: providerConfig?.defaultEndpoint || '',
      model: providerConfig?.models[0] || '',
    })
    setTestResult(null)
    setSaved(false)
  }

  function saveSettings() {
    localStorage.setItem('ai-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function testConnection() {
    setTesting(true)
    setTestResult(null)
    setTestMessage('')

    try {
      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTestResult('success')
        setTestMessage(data.message || 'Connection successful!')
      } else {
        setTestResult('error')
        setTestMessage(data.error || 'Connection failed')
      }
    } catch (error) {
      setTestResult('error')
      setTestMessage(error instanceof Error ? error.message : 'Connection failed')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="flex items-center gap-3 mb-2">
        <Bot className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">AI Settings</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Configure AI providers to enable intelligent features throughout Scrivenry
      </p>

      {/* Provider Selection */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">AI Provider</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {providers.map(({ value, label, description, icon: Icon }) => (
            <button
              key={value}
              onClick={() => selectProvider(value)}
              className={cn(
                'p-4 rounded-lg border text-left transition-all',
                settings.provider === value
                  ? 'border-primary bg-primary/10 ring-2 ring-primary'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <Icon className="h-6 w-6 mb-2 text-primary" />
              <div className="font-medium">{label}</div>
              <div className="text-sm text-muted-foreground">{description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* API Key */}
      {currentProvider?.requiresKey && (
        <form className="mb-6" onSubmit={(e) => e.preventDefault()} autoComplete="off">
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <Key className="h-4 w-4" />
            API Key
          </label>
          <input
            type="password"
            name="api-key"
            value={settings.apiKey}
            onChange={(e) => {
              setSettings({ ...settings, apiKey: e.target.value })
              setSaved(false)
            }}
            placeholder={`Enter your ${currentProvider.label} API key`}
            autoComplete="new-password"
            data-1p-ignore
            className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Your API key is stored locally and never sent to our servers
          </p>
        </form>
      )}

      {/* Endpoint */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <Server className="h-4 w-4" />
          API Endpoint
        </label>
        <input
          type="text"
          value={settings.endpoint}
          onChange={(e) => {
            setSettings({ ...settings, endpoint: e.target.value })
            setSaved(false)
          }}
          placeholder={currentProvider?.defaultEndpoint}
          className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {settings.provider === 'ollama'
            ? 'Local Ollama server address (default: http://localhost:11434)'
            : 'API endpoint URL (leave default unless using a proxy)'}
        </p>
      </div>

      {/* Model Selection */}
      <div className="mb-8">
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <Cpu className="h-4 w-4" />
          Model
          {settings.provider === 'ollama' && (
            <button
              onClick={() => fetchModels(settings.provider, settings.endpoint || currentProvider?.defaultEndpoint || '', settings.model)}
              disabled={loadingModels}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RefreshCw className={cn('h-3 w-3', loadingModels && 'animate-spin')} />
              {loadingModels ? 'Loading...' : 'Refresh'}
            </button>
          )}
        </label>
        <select
          value={settings.model}
          onChange={(e) => {
            setSettings({ ...settings, model: e.target.value })
            setSaved(false)
          }}
          disabled={loadingModels}
          className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          {availableModels.length > 0 ? (
            availableModels.map((model) => (
              <option key={model.name} value={model.name}>
                {model.name}
                {model.size > 0 && ` (${formatBytes(model.size)})`}
              </option>
            ))
          ) : (
            currentProvider?.models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))
          )}
        </select>
        {modelsError && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {modelsError}
          </p>
        )}
        {settings.provider === 'ollama' && !modelsError && (
          <p className="text-xs text-muted-foreground mt-1">
            {availableModels.length > 0
              ? `${availableModels.length} model${availableModels.length !== 1 ? 's' : ''} available locally`
              : 'No models found. Pull a model with: ollama pull llama3.2'}
          </p>
        )}
      </div>

      {/* Test Connection */}
      <div className="mb-8 p-4 rounded-lg border bg-card">
        <h3 className="font-medium mb-3">Test Connection</h3>
        <div className="flex items-center gap-4">
          <Button onClick={testConnection} disabled={testing}>
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          {testResult && (
            <div
              className={cn(
                'flex items-center gap-2 text-sm',
                testResult === 'success' ? 'text-green-500' : 'text-red-500'
              )}
            >
              {testResult === 'success' ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {testMessage}
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button onClick={saveSettings} size="lg">
          {saved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
        <span className="text-sm text-muted-foreground">
          Settings are saved to your browser&apos;s local storage
        </span>
      </div>

      {/* AI Features Info */}
      <div className="mt-12 p-6 rounded-lg border bg-muted/30">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Features Available
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            AI Writing Assistant - Improve, expand, summarize, or translate text
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            AI Chat - Ask questions about your page content
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Generate Content - Create pages, tables, and lists from prompts
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            AI Blocks - Insert AI-generated content directly in your pages
          </li>
        </ul>
      </div>
    </div>
  )
}
