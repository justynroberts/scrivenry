import { POST } from '@/app/api/ai/test/route'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('AI Test API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (body: object) => {
    return new Request('http://localhost/api/ai/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  describe('Ollama provider', () => {
    const ollamaSettings = {
      provider: 'ollama',
      apiKey: '',
      endpoint: 'http://localhost:11434',
      model: 'llama2',
    }

    it('should successfully test Ollama connection', async () => {
      // Mock tags endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          models: [{ name: 'llama2' }, { name: 'mistral' }],
        }),
      })
      // Mock generate endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ response: 'ok' }),
      })

      const request = createRequest(ollamaSettings)
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.message).toContain('Connected to Ollama')
    })

    it('should return error when Ollama not running', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

      const request = createRequest(ollamaSettings)
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toContain('Cannot connect to Ollama')
    })

    it('should return error when Ollama tags endpoint fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const request = createRequest(ollamaSettings)
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toBe('Ollama server not responding')
    })

    it('should warn when model not found but others available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          models: [{ name: 'mistral' }, { name: 'codellama' }],
        }),
      })

      const request = createRequest({ ...ollamaSettings, model: 'nonexistent' })
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.message).toContain('Model "nonexistent" not found')
      expect(data.message).toContain('Available:')
    })

    it('should return error when model generate fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          models: [{ name: 'llama2' }],
        }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const request = createRequest(ollamaSettings)
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toContain('not available')
      expect(data.error).toContain('ollama pull')
    })

    it('should use default endpoint when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [{ name: 'llama2' }] }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ response: 'ok' }),
      })

      const request = createRequest({ ...ollamaSettings, endpoint: '' })
      await POST(request as any)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/tags')
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
      const request = createRequest({ ...anthropicSettings, apiKey: '' })
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toBe('API key required')
    })

    it('should successfully test Anthropic connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [{ text: 'ok' }] }),
      })

      const request = createRequest(anthropicSettings)
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.message).toContain('Connected to')
    })

    it('should handle Anthropic API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Invalid API key' } }),
      })

      const request = createRequest(anthropicSettings)
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid API key')
    })

    it('should use default endpoint when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [{ text: 'ok' }] }),
      })

      const request = createRequest({ ...anthropicSettings, endpoint: '' })
      await POST(request as any)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.anything()
      )
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
      const request = createRequest({ ...openaiSettings, apiKey: '' })
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toBe('API key required')
    })

    it('should successfully test OpenAI connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'ok' } }] }),
      })

      const request = createRequest(openaiSettings)
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.message).toContain('Connected to')
    })

    it('should handle OpenAI API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Incorrect API key' } }),
      })

      const request = createRequest(openaiSettings)
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toBe('Incorrect API key')
    })

    it('should use default endpoint when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'ok' } }] }),
      })

      const request = createRequest({ ...openaiSettings, endpoint: '' })
      await POST(request as any)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.anything()
      )
    })
  })

  describe('unknown provider', () => {
    it('should return error for unknown provider', async () => {
      const request = createRequest({
        provider: 'unknown',
        apiKey: '',
        endpoint: '',
        model: 'test',
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toBe('Unknown provider')
    })
  })

  describe('error handling', () => {
    it('should handle JSON parse errors', async () => {
      const request = new Request('http://localhost/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})
