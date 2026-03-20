import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword, generateJWTSync, validateCSRFToken } from '@/lib/auth'
import { checkRateLimit, REGISTER_LIMIT, getClientIP } from '@/lib/rate-limit'
import { ulid } from 'ulid'

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateCheck = checkRateLimit(`register:${clientIP}`, REGISTER_LIMIT)
    
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateCheck.resetIn / 1000).toString(),
            'X-RateLimit-Remaining': '0',
          }
        }
      )
    }

    const body = await request.json()
    const { email, password, name, csrfToken } = body
    
    // CSRF validation
    if (!validateCSRFToken(csrfToken)) {
      return NextResponse.json({ error: 'Invalid request. Please refresh and try again.' }, { status: 403 })
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    })

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const userId = ulid()
    const passwordHash = await hashPassword(password)
    
    await db.insert(users).values({
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      name: name || null,
    })

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) throw new Error('Failed to create user')

    const token = generateJWTSync({ userId: user.id, email: user.email })

    // Create response with httpOnly cookie
    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name } 
    })

    const isSecure = process.env.AUTH_SECURE_COOKIES === 'true' || process.env.NODE_ENV === 'production'
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 604800, // 7 days
    })

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
