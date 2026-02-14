import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// GET - Get single notification
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const notification = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, id),
        eq(notifications.userId, user.id)
      ),
    })

    if (!notification) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Failed to get notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update notification status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, snoozedUntil } = body

    // Verify ownership
    const existing = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, id),
        eq(notifications.userId, user.id)
      ),
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const now = new Date()
    let updates: Partial<typeof notifications.$inferInsert> = {}

    switch (action) {
      case 'read':
        updates = { status: 'read', readAt: now }
        break
      case 'unread':
        updates = { status: 'unread', readAt: null }
        break
      case 'snooze':
        if (!snoozedUntil) {
          return NextResponse.json({ error: 'snoozedUntil is required for snooze action' }, { status: 400 })
        }
        updates = { status: 'snoozed', snoozedUntil: new Date(snoozedUntil) }
        break
      case 'accept':
        updates = { status: 'accepted', readAt: now }
        break
      case 'archive':
        updates = { archivedAt: now }
        break
      case 'unarchive':
        updates = { archivedAt: null }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const [updated] = await db.update(notifications)
      .set(updates)
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, user.id)
      ))
      .returning()

    return NextResponse.json({ notification: updated })
  } catch (error) {
    console.error('Failed to update notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Permanently delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, id),
        eq(notifications.userId, user.id)
      ),
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await db.delete(notifications)
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, user.id)
      ))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
