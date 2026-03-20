// MIT License - Copyright (c) fintonlabs.com

/**
 * Universal API client for deployment-agnostic requests.
 * Works with basePath set (Traefik at /scrivenry) or without (standalone at root).
 *
 * Next.js injects the configured basePath into __NEXT_DATA__ at runtime,
 * so this works regardless of how the app is deployed.
 */

// Get basePath from Next.js runtime data
function getBasePath(): string {
  if (typeof window === 'undefined') return ''
  try {
    const nextData = (window as any).__NEXT_DATA__
    return nextData?.basePath || ''
  } catch {
    return ''
  }
}

/**
 * Build full API URL, handling basePath automatically.
 * @param path API path, e.g. '/api/pages/123'
 * @returns Full path with basePath prepended if configured
 */
export function apiUrl(path: string): string {
  const basePath = getBasePath()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${basePath}${normalizedPath}`
}

/**
 * Drop-in fetch replacement with auto-basePath handling.
 * Use this instead of fetch() for all internal API calls.
 * @param path API path (e.g. '/api/pages')
 * @param init RequestInit options
 * @returns Promise<Response>
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init)
}

/**
 * Helper: GET request, returns parsed JSON
 */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path)
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`)
  return res.json()
}

/**
 * Helper: POST request, returns parsed JSON
 */
export async function apiPost<T>(path: string, data?: any): Promise<T> {
  const res = await apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  })
  if (!res.ok) throw new Error(`POST ${path}: ${res.status}`)
  return res.json()
}

/**
 * Helper: PUT request, returns parsed JSON
 */
export async function apiPut<T>(path: string, data?: any): Promise<T> {
  const res = await apiFetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  })
  if (!res.ok) throw new Error(`PUT ${path}: ${res.status}`)
  return res.json()
}

/**
 * Helper: DELETE request, returns parsed JSON
 */
export async function apiDelete<T>(path: string): Promise<T> {
  const res = await apiFetch(path, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE ${path}: ${res.status}`)
  return res.json()
}

/**
 * Build client-side URL (for navigation, links, etc.)
 * Note: Next.js <Link> and useRouter() already respect basePath automatically.
 * Use this only for manually constructed URLs (e.g. window.open, copy-to-clipboard).
 */
export function clientUrl(path: string): string {
  const basePath = getBasePath()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${basePath}${normalizedPath}`
}

/**
 * Build external share URL (for publishing / copy-to-clipboard).
 * Constructs full origin + basePath + share path.
 */
export function shareUrl(shareId: string): string {
  if (typeof window === 'undefined') return ''
  const basePath = getBasePath()
  return `${window.location.origin}${basePath}/share/${shareId}`
}
