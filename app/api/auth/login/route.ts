import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword, generateJWTSync } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
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

    return NextResponse.json({ 
      success: true, 
      token, 
      user: { id: user.id, email: user.email, name: user.name } 
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
