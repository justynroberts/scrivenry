import { db } from './db'
import { users } from './db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { createHmac } from 'crypto'

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return (await hashPassword(password)) === hash
}

// Simple JWT using Node crypto
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

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    path: '/',
    secure: process.env.AUTH_SECURE_COOKIES === 'true',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 604800,
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
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
      where: eq(users.id, payload.sub),
    })
    return {
      user: user ? { id: user.id, email: user.email, name: user.name } : null,
      session: payload
    }
  } catch {
    return { user: null, session: null }
  }
})
