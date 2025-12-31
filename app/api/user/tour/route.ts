import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET - Check tour status
export async function GET() {
  const { user } = await validateRequest()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [dbUser] = await db
    .select({ hasSeenTour: users.hasSeenTour })
    .from(users)
    .where(eq(users.id, user.id))

  return NextResponse.json({ hasSeenTour: dbUser?.hasSeenTour ?? false })
}

// POST - Mark tour as completed
export async function POST() {
  const { user } = await validateRequest()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await db
    .update(users)
    .set({ hasSeenTour: true })
    .where(eq(users.id, user.id))

  return NextResponse.json({ success: true })
}
