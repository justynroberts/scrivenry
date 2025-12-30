import { POST } from '@/app/api/ai/models/route'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('AI Models API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (body: object) => {
    return new Request('http://localhost/api/ai/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  describe('Ollama provider', () => {
    it('should return list of available Ollama models', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          models: [
            { name: 'llama2', size: 3826793677, modified_at: '2025-01-01T00:00:00Z' },
            { name: 'mistral', size: 4100000000, modified_at: '2025-01-02T00:00:00Z' },
          ],
        }),
      })

      const request = createRequest({ provider: 'ollama', endpoint: 'http://localhost:11434' })
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.models).toHaveLength(2)
      expect(data.models[0].name).toBe('llama2')
      expect(data.models[0].size).toBe(3826793677)
    })

    it('should use default endpoint when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      })

      const request = createRequest({ provider: 'ollama', endpoint: '' })
      await POST(request as any)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/tags')
    })

    it('should return error when Ollama not responding', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const request = createRequest({ provider: 'ollama', endpoint: 'http://localhost:11434' })
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toBe('Ollama server not responding')
      expect(data.models).toEqual([])
    })

    it('should return error when cannot connect to Ollama', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

      const request = createRequest({ provider: 'ollama', endpoint: 'http://localhost:11434' })
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toContain('Cannot connect to Ollama')
    })

    it('should handle empty models list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      })

      const request = createRequest({ provider: 'ollama', endpoint: 'http://localhost:11434' })
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.models).toEqual([])
    })
  })

  describe('Anthropic provider', () => {
    it('should return static list of Anthropic models', async () => {
      const request = createRequest({ provider: 'anthropic', endpoint: '' })
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.models.length).toBeGreaterThan(0)
      expect(data.models.some((m: { name: string }) => m.name.includes('claude'))).toBe(true)
    })
  })

  describe('OpenAI provider', () => {
    it('should return static list of OpenAI models', async () => {
      const request = createRequest({ provider: 'openai', endpoint: '' })
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.models.length).toBeGreaterThan(0)
      expect(data.models.some((m: { name: string }) => m.name.includes('gpt'))).toBe(true)
    })
  })

  describe('unknown provider', () => {
    it('should return error for unknown provider', async () => {
      const request = createRequest({ provider: 'unknown', endpoint: '' })
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toBe('Unknown provider')
    })
  })

  describe('error handling', () => {
    it('should handle JSON parse errors', async () => {
      const request = new Request('http://localhost/api/ai/models', {
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
