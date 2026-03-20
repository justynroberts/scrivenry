import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword, generateJWTSync, validateCSRFToken } from '@/lib/auth'
import { checkRateLimit, LOGIN_LIMIT, getClientIP } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateCheck = checkRateLimit(`login:${clientIP}`, LOGIN_LIMIT)
    
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
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
    const { email, password, csrfToken } = body
    
    // CSRF validation
    if (!validateCSRFToken(csrfToken)) {
      return NextResponse.json({ error: 'Invalid request. Please refresh and try again.' }, { status: 403 })
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    })

    if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

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
    console.error('Login error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
