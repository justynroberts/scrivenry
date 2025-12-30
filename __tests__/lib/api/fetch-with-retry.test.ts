import { fetchWithRetry } from '@/lib/api/fetch-with-retry'

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('fetchWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns response on first successful request', async () => {
    const mockResponse = new Response(JSON.stringify({ success: true }), { status: 200 })
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await fetchWithRetry('/api/test', { method: 'GET' })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.status).toBe(200)
  })

  it('retries on 404 and succeeds on second attempt', async () => {
    const notFoundResponse = new Response('Not Found', { status: 404 })
    const successResponse = new Response(JSON.stringify({ success: true }), { status: 200 })

    mockFetch
      .mockResolvedValueOnce(notFoundResponse)
      .mockResolvedValueOnce(successResponse)

    const fetchPromise = fetchWithRetry('/api/test', { method: 'GET' }, 3, 100)

    // Advance timers for retry delay
    await jest.advanceTimersByTimeAsync(100)

    const result = await fetchPromise

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result.status).toBe(200)
  })

  it('retries on network error and succeeds', async () => {
    const networkError = new Error('Network error')
    const successResponse = new Response(JSON.stringify({ success: true }), { status: 200 })

    mockFetch
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(successResponse)

    const fetchPromise = fetchWithRetry('/api/test', { method: 'GET' }, 3, 100)

    await jest.advanceTimersByTimeAsync(100)

    const result = await fetchPromise

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result.status).toBe(200)
  })

  it('returns 404 response after max retries', async () => {
    const notFoundResponse = new Response('Not Found', { status: 404 })

    mockFetch
      .mockResolvedValueOnce(notFoundResponse)
      .mockResolvedValueOnce(notFoundResponse)
      .mockResolvedValueOnce(notFoundResponse)

    const fetchPromise = fetchWithRetry('/api/test', { method: 'GET' }, 3, 100)

    await jest.advanceTimersByTimeAsync(200)

    const result = await fetchPromise

    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(result.status).toBe(404)
  })

  it('throws error after max retries on network failures', async () => {
    jest.useRealTimers() // Use real timers for this test
    const networkError = new Error('Network error')

    mockFetch
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)

    await expect(
      fetchWithRetry('/api/test', { method: 'GET' }, 3, 10)
    ).rejects.toThrow('Network error')
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('returns non-404 error response immediately without retry', async () => {
    const serverErrorResponse = new Response('Server Error', { status: 500 })
    mockFetch.mockResolvedValueOnce(serverErrorResponse)

    const result = await fetchWithRetry('/api/test', { method: 'GET' })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.status).toBe(500)
  })
})
