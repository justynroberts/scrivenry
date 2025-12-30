export type AIProvider = 'anthropic' | 'ollama' | 'openai'

export interface AISettings {
  provider: AIProvider
  apiKey: string
  endpoint: string
  model: string
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIResponse {
  content: string
  model: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

export function getAISettings(): AISettings | null {
  if (typeof window === 'undefined') return null

  const saved = localStorage.getItem('ai-settings')
  if (!saved) return null

  try {
    return JSON.parse(saved)
  } catch {
    return null
  }
}

export async function callAI(
  messages: AIMessage[],
  settings?: AISettings
): Promise<AIResponse> {
  const config = settings || getAISettings()

  if (!config) {
    throw new Error('AI not configured. Please set up AI in Settings > AI.')
  }

  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      settings: config,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'AI request failed')
  }

  return response.json()
}

export async function streamAI(
  messages: AIMessage[],
  onChunk: (text: string) => void,
  settings?: AISettings
): Promise<void> {
  const config = settings || getAISettings()

  if (!config) {
    throw new Error('AI not configured. Please set up AI in Settings > AI.')
  }

  const response = await fetch('/api/ai/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      settings: config,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'AI request failed')
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const text = decoder.decode(value)
    onChunk(text)
  }
}

// Preset prompts for common AI actions
export const AI_PROMPTS = {
  improve: (text: string) => `Improve the following text, making it clearer and more professional. Return only the improved text without any explanation:\n\n${text}`,

  expand: (text: string) => `Expand on the following text, adding more detail and depth. Return only the expanded text without any explanation:\n\n${text}`,

  summarize: (text: string) => `Summarize the following text concisely. Return only the summary without any explanation:\n\n${text}`,

  fixGrammar: (text: string) => `Fix any grammar and spelling errors in the following text. Return only the corrected text without any explanation:\n\n${text}`,

  translate: (text: string, language: string) => `Translate the following text to ${language}. Return only the translation without any explanation:\n\n${text}`,

  simplify: (text: string) => `Simplify the following text, making it easier to understand. Return only the simplified text without any explanation:\n\n${text}`,

  makeLonger: (text: string) => `Make the following text longer by adding relevant details and examples. Return only the expanded text without any explanation:\n\n${text}`,

  makeShorter: (text: string) => `Make the following text shorter while keeping the key points. Return only the shortened text without any explanation:\n\n${text}`,

  generateFromPrompt: (prompt: string) => `Generate content based on the following prompt. Be detailed and thorough:\n\n${prompt}`,

  generateTable: (prompt: string) => `Generate a markdown table based on the following prompt. Return only the markdown table:\n\n${prompt}`,

  generateList: (prompt: string) => `Generate a bullet point list based on the following prompt. Return only the list:\n\n${prompt}`,

  explainCode: (code: string) => `Explain what this code does in simple terms:\n\n\`\`\`\n${code}\n\`\`\``,

  askQuestion: (context: string, question: string) => `Based on the following context, answer the question.\n\nContext:\n${context}\n\nQuestion: ${question}`,
}
