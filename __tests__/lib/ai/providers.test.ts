import {
  AIProvider,
  AISettings,
  AIMessage,
  AIResponse,
  getAISettings,
  callAI,
  streamAI,
  AI_PROMPTS,
} from '@/lib/ai/providers'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('AI Providers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('types', () => {
    it('should have correct AIProvider type', () => {
      const providers: AIProvider[] = ['anthropic', 'ollama', 'openai']
      expect(providers).toHaveLength(3)
    })

    it('should have correct AISettings interface', () => {
      const settings: AISettings = {
        provider: 'ollama',
        apiKey: '',
        endpoint: 'http://localhost:11434',
        model: 'llama2',
      }
      expect(settings.provider).toBe('ollama')
    })

    it('should have correct AIMessage interface', () => {
      const message: AIMessage = {
        role: 'user',
        content: 'Hello',
      }
      expect(message.role).toBe('user')
    })

    it('should have correct AIResponse interface', () => {
      const response: AIResponse = {
        content: 'Hello!',
        model: 'llama2',
        usage: {
          inputTokens: 10,
          outputTokens: 5,
        },
      }
      expect(response.content).toBe('Hello!')
    })
  })

  describe('getAISettings', () => {
    it('should return null when no settings saved', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const result = getAISettings()
      expect(result).toBeNull()
    })

    it('should return parsed settings when valid JSON saved', () => {
      const settings: AISettings = {
        provider: 'ollama',
        apiKey: '',
        endpoint: 'http://localhost:11434',
        model: 'llama2',
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(settings))

      const result = getAISettings()
      expect(result).toEqual(settings)
    })

    it('should return null when invalid JSON saved', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      const result = getAISettings()
      expect(result).toBeNull()
    })
  })

  describe('callAI', () => {
    const mockSettings: AISettings = {
      provider: 'ollama',
      apiKey: '',
      endpoint: 'http://localhost:11434',
      model: 'llama2',
    }

    const mockMessages: AIMessage[] = [
      { role: 'user', content: 'Hello' },
    ]

    it('should throw error when no settings configured', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      await expect(callAI(mockMessages)).rejects.toThrow(
        'AI not configured. Please set up AI in Settings > AI.'
      )
    })

    it('should call API with correct settings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: 'Hello!',
          model: 'llama2',
        }),
      })

      const result = await callAI(mockMessages, mockSettings)

      expect(mockFetch).toHaveBeenCalledWith('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: mockMessages,
          settings: mockSettings,
        }),
      })
      expect(result.content).toBe('Hello!')
    })

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'API error' }),
      })

      await expect(callAI(mockMessages, mockSettings)).rejects.toThrow('API error')
    })

    it('should throw generic error when no error message provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      })

      await expect(callAI(mockMessages, mockSettings)).rejects.toThrow('AI request failed')
    })

    it('should use settings from localStorage when not provided', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSettings))
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: 'Response', model: 'llama2' }),
      })

      await callAI(mockMessages)

      expect(mockFetch).toHaveBeenCalledWith('/api/ai/chat', expect.objectContaining({
        body: expect.stringContaining('ollama'),
      }))
    })
  })

  describe('streamAI', () => {
    const mockSettings: AISettings = {
      provider: 'ollama',
      apiKey: '',
      endpoint: 'http://localhost:11434',
      model: 'llama2',
    }

    const mockMessages: AIMessage[] = [
      { role: 'user', content: 'Hello' },
    ]

    it('should throw error when no settings configured', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      const onChunk = jest.fn()

      await expect(streamAI(mockMessages, onChunk)).rejects.toThrow(
        'AI not configured. Please set up AI in Settings > AI.'
      )
    })

    it('should stream chunks to callback', async () => {
      const chunks = ['Hello', ' ', 'World']
      let chunkIndex = 0

      const mockReader = {
        read: jest.fn().mockImplementation(() => {
          if (chunkIndex < chunks.length) {
            const chunk = chunks[chunkIndex++]
            return Promise.resolve({
              done: false,
              value: new TextEncoder().encode(chunk),
            })
          }
          return Promise.resolve({ done: true, value: undefined })
        }),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader },
      })

      const onChunk = jest.fn()
      await streamAI(mockMessages, onChunk, mockSettings)

      expect(onChunk).toHaveBeenCalledTimes(3)
      expect(onChunk).toHaveBeenNthCalledWith(1, 'Hello')
      expect(onChunk).toHaveBeenNthCalledWith(2, ' ')
      expect(onChunk).toHaveBeenNthCalledWith(3, 'World')
    })

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Stream error' }),
      })

      const onChunk = jest.fn()
      await expect(streamAI(mockMessages, onChunk, mockSettings)).rejects.toThrow('Stream error')
    })

    it('should throw error when no response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: null,
      })

      const onChunk = jest.fn()
      await expect(streamAI(mockMessages, onChunk, mockSettings)).rejects.toThrow('No response body')
    })
  })

  describe('AI_PROMPTS', () => {
    const testText = 'This is test content.'

    it('should generate improve prompt', () => {
      const prompt = AI_PROMPTS.improve(testText)
      expect(prompt).toContain('Improve the following text')
      expect(prompt).toContain(testText)
    })

    it('should generate expand prompt', () => {
      const prompt = AI_PROMPTS.expand(testText)
      expect(prompt).toContain('Expand on the following text')
      expect(prompt).toContain(testText)
    })

    it('should generate summarize prompt', () => {
      const prompt = AI_PROMPTS.summarize(testText)
      expect(prompt).toContain('Summarize the following text')
      expect(prompt).toContain(testText)
    })

    it('should generate fixGrammar prompt', () => {
      const prompt = AI_PROMPTS.fixGrammar(testText)
      expect(prompt).toContain('Fix any grammar and spelling errors')
      expect(prompt).toContain(testText)
    })

    it('should generate translate prompt with language', () => {
      const prompt = AI_PROMPTS.translate(testText, 'Spanish')
      expect(prompt).toContain('Translate the following text to Spanish')
      expect(prompt).toContain(testText)
    })

    it('should generate simplify prompt', () => {
      const prompt = AI_PROMPTS.simplify(testText)
      expect(prompt).toContain('Simplify the following text')
      expect(prompt).toContain(testText)
    })

    it('should generate makeLonger prompt', () => {
      const prompt = AI_PROMPTS.makeLonger(testText)
      expect(prompt).toContain('Make the following text longer')
      expect(prompt).toContain(testText)
    })

    it('should generate makeShorter prompt', () => {
      const prompt = AI_PROMPTS.makeShorter(testText)
      expect(prompt).toContain('Make the following text shorter')
      expect(prompt).toContain(testText)
    })

    it('should generate generateFromPrompt', () => {
      const prompt = AI_PROMPTS.generateFromPrompt('Write a poem')
      expect(prompt).toContain('Generate content based on')
      expect(prompt).toContain('Write a poem')
    })

    it('should generate generateTable prompt', () => {
      const prompt = AI_PROMPTS.generateTable('Countries and capitals')
      expect(prompt).toContain('Generate a markdown table')
      expect(prompt).toContain('Countries and capitals')
    })

    it('should generate generateList prompt', () => {
      const prompt = AI_PROMPTS.generateList('Top 5 programming languages')
      expect(prompt).toContain('Generate a bullet point list')
      expect(prompt).toContain('Top 5 programming languages')
    })

    it('should generate explainCode prompt', () => {
      const code = 'function hello() { return "world"; }'
      const prompt = AI_PROMPTS.explainCode(code)
      expect(prompt).toContain('Explain what this code does')
      expect(prompt).toContain(code)
    })

    it('should generate askQuestion prompt', () => {
      const context = 'JavaScript is a programming language.'
      const question = 'What is JavaScript?'
      const prompt = AI_PROMPTS.askQuestion(context, question)
      expect(prompt).toContain('Based on the following context')
      expect(prompt).toContain(context)
      expect(prompt).toContain(question)
    })
  })
})
