import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateJWTSync } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  
  const allCookies = cookieStore.getAll().map(c => ({ name: c.name, value: c.value?.substring(0, 30) + '...' }))
  
  let payload = null
  let user = null
  let error = null
  
  try {
    if (token) {
      payload = validateJWTSync(token)
      if (payload) {
        user = await db.query.users.findFirst({
          where: eq(users.id, payload.userId),
        })
      }
    }
  } catch (e: any) {
    error = e.message
  }
  
  return NextResponse.json({
    hasToken: !!token,
    tokenFirst30: token?.substring(0, 30) || null,
    payload,
    user: user ? { id: user.id, email: user.email } : null,
    error,
    allCookies
  })
}
