import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword, generateJWTSync } from '@/lib/auth'
import { ulid } from 'ulid'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
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

    return NextResponse.json({ 
      success: true, 
      token, 
      user: { id: user.id, email: user.email, name: user.name } 
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
