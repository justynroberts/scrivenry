import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET handler to help with route registration
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/ai/models',
    methods: ['POST']
  })
}

interface OllamaModel {
  name: string
  modified_at: string
  size: number
}

interface OllamaTagsResponse {
  models: OllamaModel[]
}

export async function POST(request: NextRequest) {
  try {
    const { provider, endpoint } = await request.json()

    if (provider === 'ollama') {
      const ollamaEndpoint = endpoint || 'http://localhost:11434'

      try {
        const response = await fetch(`${ollamaEndpoint}/api/tags`)

        if (!response.ok) {
          return NextResponse.json(
            { success: false, error: 'Ollama server not responding', models: [] },
            { status: 400 }
          )
        }

        const data: OllamaTagsResponse = await response.json()
        const models = data.models?.map((m) => ({
          name: m.name,
          size: m.size,
          modified: m.modified_at,
        })) || []

        return NextResponse.json({
          success: true,
          models,
        })
      } catch {
        return NextResponse.json(
          { success: false, error: 'Cannot connect to Ollama. Is it running?', models: [] },
          { status: 400 }
        )
      }
    }

    // For other providers, return static model lists
    if (provider === 'anthropic') {
      return NextResponse.json({
        success: true,
        models: [
          { name: 'claude-sonnet-4-20250514', size: 0 },
          { name: 'claude-opus-4-20250514', size: 0 },
          { name: 'claude-3-5-haiku-20241022', size: 0 },
        ],
      })
    }

    if (provider === 'openai') {
      return NextResponse.json({
        success: true,
        models: [
          { name: 'gpt-4o', size: 0 },
          { name: 'gpt-4o-mini', size: 0 },
          { name: 'gpt-4-turbo', size: 0 },
          { name: 'gpt-3.5-turbo', size: 0 },
        ],
      })
    }

    return NextResponse.json(
      { success: false, error: 'Unknown provider', models: [] },
      { status: 400 }
    )
  } catch (error) {
    console.error('Models fetch error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch models', models: [] },
      { status: 500 }
    )
  }
}
