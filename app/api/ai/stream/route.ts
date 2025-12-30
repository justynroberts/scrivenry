import { NextRequest } from 'next/server'

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

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { messages, settings, maxTokens = 4096 } = body
    const { provider, apiKey, endpoint, model } = settings

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (provider === 'anthropic') {
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

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
          stream: true,
          system: systemMessage,
          messages: chatMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return new Response(JSON.stringify({ error: error.error?.message || 'Anthropic API error' }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Transform Anthropic SSE to plain text stream
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()

      const transformStream = new TransformStream({
        async transform(chunk, controller) {
          const text = decoder.decode(chunk)
          const lines = text.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.type === 'content_block_delta' && data.delta?.text) {
                  controller.enqueue(encoder.encode(data.delta.text))
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        },
      })

      return new Response(response.body?.pipeThrough(transformStream), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      })
    }

    if (provider === 'ollama') {
      const ollamaEndpoint = endpoint || 'http://localhost:11434'

      const prompt = messages
        .map((m) => {
          if (m.role === 'system') return `System: ${m.content}`
          if (m.role === 'user') return `User: ${m.content}`
          return `Assistant: ${m.content}`
        })
        .join('\n\n')

      const response = await fetch(`${ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: true,
        }),
      })

      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Ollama API error' }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Transform Ollama NDJSON to plain text stream
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()

      const transformStream = new TransformStream({
        async transform(chunk, controller) {
          const text = decoder.decode(chunk)
          const lines = text.split('\n').filter((l) => l.trim())

          for (const line of lines) {
            try {
              const data = JSON.parse(line)
              if (data.response) {
                controller.enqueue(encoder.encode(data.response))
              }
            } catch {
              // Skip invalid JSON
            }
          }
        },
      })

      return new Response(response.body?.pipeThrough(transformStream), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      })
    }

    if (provider === 'openai') {
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
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
          stream: true,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return new Response(JSON.stringify({ error: error.error?.message || 'OpenAI API error' }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Transform OpenAI SSE to plain text stream
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()

      const transformStream = new TransformStream({
        async transform(chunk, controller) {
          const text = decoder.decode(chunk)
          const lines = text.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6))
                const content = data.choices?.[0]?.delta?.content
                if (content) {
                  controller.enqueue(encoder.encode(content))
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        },
      })

      return new Response(response.body?.pipeThrough(transformStream), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown provider' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('AI stream error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'AI request failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
