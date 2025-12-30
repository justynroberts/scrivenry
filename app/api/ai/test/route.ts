import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET handler to help with route registration
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/ai/test',
    methods: ['POST']
  })
}

interface AISettings {
  provider: 'anthropic' | 'ollama' | 'openai'
  apiKey: string
  endpoint: string
  model: string
}

export async function POST(request: NextRequest) {
  try {
    const settings: AISettings = await request.json()
    const { provider, apiKey, endpoint, model } = settings

    if (provider === 'anthropic') {
      if (!apiKey) {
        return NextResponse.json({ success: false, error: 'API key required' }, { status: 400 })
      }

      const response = await fetch(`${endpoint || 'https://api.anthropic.com'}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-sonnet-4-20250514',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Say "ok"' }],
        }),
      })

      if (response.ok) {
        return NextResponse.json({ success: true, message: `Connected to ${model}` })
      } else {
        const error = await response.json()
        return NextResponse.json(
          { success: false, error: error.error?.message || 'Connection failed' },
          { status: 400 }
        )
      }
    }

    if (provider === 'ollama') {
      const ollamaEndpoint = endpoint || 'http://localhost:11434'

      // First check if Ollama is running
      try {
        const tagsResponse = await fetch(`${ollamaEndpoint}/api/tags`)
        if (!tagsResponse.ok) {
          return NextResponse.json(
            { success: false, error: 'Ollama server not responding' },
            { status: 400 }
          )
        }

        const tags = await tagsResponse.json()
        const models = tags.models?.map((m: { name: string }) => m.name) || []

        // Check if the selected model exists
        const modelExists = models.some((m: string) => m.startsWith(model))

        if (!modelExists && models.length > 0) {
          return NextResponse.json({
            success: true,
            message: `Connected to Ollama. Model "${model}" not found. Available: ${models.slice(0, 3).join(', ')}`,
          })
        }

        // Test the model
        const response = await fetch(`${ollamaEndpoint}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt: 'Say ok',
            stream: false,
          }),
        })

        if (response.ok) {
          return NextResponse.json({ success: true, message: `Connected to Ollama (${model})` })
        } else {
          return NextResponse.json(
            { success: false, error: `Model "${model}" not available. Run: ollama pull ${model}` },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json(
          { success: false, error: 'Cannot connect to Ollama. Is it running?' },
          { status: 400 }
        )
      }
    }

    if (provider === 'openai') {
      if (!apiKey) {
        return NextResponse.json({ success: false, error: 'API key required' }, { status: 400 })
      }

      const response = await fetch(`${endpoint || 'https://api.openai.com'}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Say "ok"' }],
        }),
      })

      if (response.ok) {
        return NextResponse.json({ success: true, message: `Connected to ${model}` })
      } else {
        const error = await response.json()
        return NextResponse.json(
          { success: false, error: error.error?.message || 'Connection failed' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ success: false, error: 'Unknown provider' }, { status: 400 })
  } catch (error) {
    console.error('AI test error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Test failed' },
      { status: 500 }
    )
  }
}
