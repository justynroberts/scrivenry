import { GET, POST } from '@/app/api/ai/chat/route'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('AI Chat API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET handler', () => {
    it('should return endpoint status', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('ok')
      expect(data.endpoint).toBe('/api/ai/chat')
      expect(data.methods).toEqual(['POST'])
    })
  })

  const createRequest = (body: object) => {
    return new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  describe('validation', () => {
    it('should return error when no messages provided', async () => {
      const request = createRequest({
        messages: [],
        settings: { provider: 'ollama', apiKey: '', endpoint: '', model: 'llama2' },
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No messages provided')
    })

    it('should return error for unknown provider', async () => {
      const request = createRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        settings: { provider: 'unknown', apiKey: '', endpoint: '', model: 'test' },
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Unknown provider')
    })
  })

  describe('Ollama provider', () => {
    const ollamaSettings = {
      provider: 'ollama',
      apiKey: '',
      endpoint: 'http://localhost:11434',
      model: 'llama2',
    }

    it('should call Ollama API with correct format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          response: 'Hello from Ollama!',
          model: 'llama2',
          prompt_eval_count: 10,
          eval_count: 20,
        }),
      })

      const request = createRequest({
        messages: [
          { role: 'system', content: 'You are helpful.' },
          { role: 'user', content: 'Hello' },
        ],
        settings: ollamaSettings,
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )

      expect(data.content).toBe('Hello from Ollama!')
      expect(data.model).toBe('llama2')
      expect(data.usage.inputTokens).toBe(10)
      expect(data.usage.outputTokens).toBe(20)
    })

    it('should use default endpoint when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ response: 'OK', model: 'llama2' }),
      })

      const request = createRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        settings: { ...ollamaSettings, endpoint: '' },
      })

      await POST(request as any)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.anything()
      )
    })

    it('should return error on Ollama API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const request = createRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        settings: ollamaSettings,
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Ollama API error')
    })

    it('should format messages correctly for Ollama', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ response: 'OK', model: 'llama2' }),
      })

      const request = createRequest({
        messages: [
          { role: 'system', content: 'Be helpful' },
          { role: 'user', content: 'Question' },
          { role: 'assistant', content: 'Answer' },
        ],
        settings: ollamaSettings,
      })

      await POST(request as any)

      const fetchCall = mockFetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)

      expect(body.prompt).toContain('System: Be helpful')
      expect(body.prompt).toContain('User: Question')
      expect(body.prompt).toContain('Assistant: Answer')
      expect(body.stream).toBe(false)
    })
  })

  describe('Anthropic provider', () => {
    const anthropicSettings = {
      provider: 'anthropic',
      apiKey: 'test-api-key',
      endpoint: 'https://api.anthropic.com',
      model: 'claude-sonnet-4-20250514',
    }

    it('should return error when API key not provided', async () => {
      const request = createRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        settings: { ...anthropicSettings, apiKey: '' },
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('API key required')
    })

    it('should call Anthropic API with correct format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: [{ text: 'Hello from Claude!' }],
          model: 'claude-sonnet-4-20250514',
          usage: { input_tokens: 10, output_tokens: 20 },
        }),
      })

      const request = createRequest({
        messages: [
          { role: 'system', content: 'You are helpful.' },
          { role: 'user', content: 'Hello' },
        ],
        settings: anthropicSettings,
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-api-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      )

      expect(data.content).toBe('Hello from Claude!')
      expect(data.usage.inputTokens).toBe(10)
      expect(data.usage.outputTokens).toBe(20)
    })

    it('should handle Anthropic API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Invalid API key' } }),
      })

      const request = createRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        settings: anthropicSettings,
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid API key')
    })
  })

  describe('OpenAI provider', () => {
    const openaiSettings = {
      provider: 'openai',
      apiKey: 'test-openai-key',
      endpoint: 'https://api.openai.com',
      model: 'gpt-4o-mini',
    }

    it('should return error when API key not provided', async () => {
      const request = createRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        settings: { ...openaiSettings, apiKey: '' },
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('API key required')
    })

    it('should call OpenAI API with correct format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Hello from GPT!' } }],
          model: 'gpt-4o-mini',
          usage: { prompt_tokens: 10, completion_tokens: 20 },
        }),
      })

      const request = createRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        settings: openaiSettings,
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-openai-key',
          }),
        })
      )

      expect(data.content).toBe('Hello from GPT!')
      expect(data.usage.inputTokens).toBe(10)
      expect(data.usage.outputTokens).toBe(20)
    })

    it('should handle OpenAI API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: { message: 'Rate limit exceeded' } }),
      })

      const request = createRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        settings: openaiSettings,
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Rate limit exceeded')
    })
  })

  describe('error handling', () => {
    it('should handle JSON parse errors', async () => {
      const request = new Request('http://localhost/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const request = createRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        settings: {
          provider: 'ollama',
          apiKey: '',
          endpoint: 'http://localhost:11434',
          model: 'llama2',
        },
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Network error')
    })
  })
})
