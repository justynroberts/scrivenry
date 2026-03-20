import { db } from './db'
import { users } from './db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { createHmac, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (hash.startsWith('$2')) {
    return bcrypt.compare(password, hash)
  }
  // Legacy SHA-256 hash (64 hex chars) - will fail, user needs to re-register
  return false
}

export function generateJWTSync(payload: Record<string, any>): string {
  const secret = process.env.JWT_SECRET || 'scrivenry-jwt-prod-secret-2026'
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const data = { ...payload, iat: now, exp: now + 604800 }
  const body = Buffer.from(JSON.stringify(data)).toString('base64url')
  const message = `${header}.${body}`
  const signature = createHmac('sha256', secret).update(message).digest('base64url')
  return `${message}.${signature}`
}

export function validateJWTSync(token: string): Record<string, any> | null {
  const secret = process.env.JWT_SECRET || 'scrivenry-jwt-prod-secret-2026'
  const parts = token.split('.')
  if (parts.length !== 3) return null
  
  try {
    const signature = createHmac('sha256', secret).update(`${parts[0]}.${parts[1]}`).digest('base64url')
    if (signature !== parts[2]) return null
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

// CSRF Token Management
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || 'scrivenry-csrf-secret'

export function generateCSRFToken(): string {
  const timestamp = Date.now().toString(36)
  const random = randomBytes(16).toString('hex')
  const data = `${timestamp}.${random}`
  const signature = createHmac('sha256', CSRF_SECRET).update(data).digest('hex').slice(0, 16)
  return `${data}.${signature}`
}

export function validateCSRFToken(token: string): boolean {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  
  const [timestamp, random, signature] = parts
  const data = `${timestamp}.${random}`
  const expectedSig = createHmac('sha256', CSRF_SECRET).update(data).digest('hex').slice(0, 16)
  
  if (signature !== expectedSig) return false
  
  // Token valid for 1 hour
  const tokenTime = parseInt(timestamp, 36)
  if (Date.now() - tokenTime > 3600000) return false
  
  return true
}

export const validateRequest = cache(async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  
  if (!token) {
    return { user: null, session: null }
  }

  const payload = validateJWTSync(token)
  if (!payload) {
    return { user: null, session: null }
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    })
    if (!user) {
      return { user: null, session: null }
    }
    return {
      user: { id: user.id, email: user.email, name: user.name },
      session: payload
    }
  } catch {
    return { user: null, session: null }
  }
})
