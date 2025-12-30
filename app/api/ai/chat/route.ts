import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface AISettings {
  provider: 'anthropic' | 'ollama' | 'openai'
  apiKey: string
  endpoint: string
  model: string
}

interface RequestBody {
  messages: AIMessage[]
  settings: AISettings
  maxTokens?: number
}

// GET handler to help with route registration and health checks
export async function GET() {
  console.log('[AI Chat] GET request received')
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/ai/chat',
    methods: ['POST']
  })
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  console.log('[AI Chat] OPTIONS request received')
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: NextRequest) {
  console.log('[AI Chat] POST request received', {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  })

  try {
    const body: RequestBody = await request.json()
    console.log('[AI Chat] Body parsed successfully')
    const { messages, settings, maxTokens = 4096 } = body
    console.log('[AI Chat] Settings:', JSON.stringify(settings))
    const { provider, apiKey, endpoint, model } = settings
    console.log('[AI Chat] Provider:', provider, 'Model:', model)

    if (!messages || messages.length === 0) {
      console.log('[AI Chat] No messages provided')
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }
    console.log('[AI Chat] Messages count:', messages.length)

    if (provider === 'anthropic') {
      if (!apiKey) {
        return NextResponse.json({ error: 'API key required' }, { status: 400 })
      }

      // Extract system message if present
      const systemMessage = messages.find((m) => m.role === 'system')?.content
      const chatMessages = messages.filter((m) => m.role !== 'system')

      const response = await fetch(`${endpoint || 'https://api.anthropic.com'}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          system: systemMessage,
          messages: chatMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return NextResponse.json(
          { error: error.error?.message || 'Anthropic API error' },
          { status: response.status }
        )
      }

      const data = await response.json()

      return NextResponse.json({
        content: data.content[0]?.text || '',
        model: data.model,
        usage: {
          inputTokens: data.usage?.input_tokens,
          outputTokens: data.usage?.output_tokens,
        },
      })
    }

    if (provider === 'ollama') {
      const ollamaEndpoint = endpoint || 'http://localhost:11434'
      console.log('[AI Chat] Using Ollama endpoint:', ollamaEndpoint)

      // Combine messages into a single prompt for Ollama
      const prompt = messages
        .map((m) => {
          if (m.role === 'system') return `System: ${m.content}`
          if (m.role === 'user') return `User: ${m.content}`
          return `Assistant: ${m.content}`
        })
        .join('\n\n')

      console.log('[AI Chat] Calling Ollama API...')
      const response = await fetch(`${ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
        }),
      })

      if (!response.ok) {
        return NextResponse.json({ error: 'Ollama API error' }, { status: response.status })
      }

      const data = await response.json()

      return NextResponse.json({
        content: data.response || '',
        model: data.model,
        usage: {
          inputTokens: data.prompt_eval_count,
          outputTokens: data.eval_count,
        },
      })
    }

    if (provider === 'openai') {
      if (!apiKey) {
        return NextResponse.json({ error: 'API key required' }, { status: 400 })
      }

      const response = await fetch(`${endpoint || 'https://api.openai.com'}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          max_tokens: maxTokens,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return NextResponse.json(
          { error: error.error?.message || 'OpenAI API error' },
          { status: response.status }
        )
      }

      const data = await response.json()

      return NextResponse.json({
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        usage: {
          inputTokens: data.usage?.prompt_tokens,
          outputTokens: data.usage?.completion_tokens,
        },
      })
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI request failed' },
      { status: 500 }
    )
  }
}
