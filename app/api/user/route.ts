import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(request: Request) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, avatar } = await request.json()

    const updates: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updates.name = name
    if (avatar !== undefined) updates.avatar = avatar

    await db.update(users).set(updates).where(eq(users.id, user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
