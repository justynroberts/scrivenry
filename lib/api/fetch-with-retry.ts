/**
 * Fetch with retry logic for handling transient 404s during Next.js dev mode HMR
 * In development, Next.js may temporarily return 404 during hot module replacement
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  retryDelay = 500
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // If we get a 404, it might be a transient HMR issue - retry
      if (response.status === 404 && attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        continue
      }

      return response
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      // Network errors - retry
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        continue
      }
    }
  }

  throw lastError || new Error('Request failed after retries')
}
