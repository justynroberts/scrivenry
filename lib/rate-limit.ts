// Simple in-memory rate limiter for Next.js API routes
// Note: In a multi-instance deployment, use Redis instead

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, 60000) // Clean every minute

export interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const key = identifier
  
  let entry = store.get(key)
  
  // Reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + config.windowMs }
    store.set(key, entry)
  }
  
  const remaining = Math.max(0, config.maxAttempts - entry.count)
  const resetIn = Math.max(0, entry.resetAt - now)
  
  if (entry.count >= config.maxAttempts) {
    return { allowed: false, remaining: 0, resetIn }
  }
  
  entry.count++
  return { allowed: true, remaining: remaining - 1, resetIn }
}

// Preset configurations
export const LOGIN_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
}

export const REGISTER_LIMIT: RateLimitConfig = {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
}

// Helper to get client IP from request
export function getClientIP(request: Request): string {
  // Check various headers for proxy setups
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Fallback
  return 'unknown'
}
