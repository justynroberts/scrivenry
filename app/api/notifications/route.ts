import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { eq, desc, and, isNull, isNotNull, or, lte } from 'drizzle-orm'
import { ulid } from 'ulid'

// GET - List notifications with optional status filter
export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'unread', 'read', 'snoozed', 'accepted', 'archived', 'all'
    const limit = parseInt(searchParams.get('limit') || '50')

    let whereClause = eq(notifications.userId, user.id)

    if (status && status !== 'all') {
      if (status === 'archived') {
        whereClause = and(whereClause, isNotNull(notifications.archivedAt))!
      } else if (status === 'active') {
        // Active = not archived
        whereClause = and(whereClause, isNull(notifications.archivedAt))!
      } else {
        whereClause = and(
          whereClause,
          eq(notifications.status, status),
          isNull(notifications.archivedAt)
        )!
      }
    }

    // Check for snoozed notifications that should be unsnoozed
    const now = new Date()
    await db.update(notifications)
      .set({ status: 'unread', snoozedUntil: null })
      .where(
        and(
          eq(notifications.userId, user.id),
          eq(notifications.status, 'snoozed'),
          lte(notifications.snoozedUntil, now)
        )
      )

    const items = await db.select().from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)

    // Count unread
    const unreadItems = await db.select().from(notifications)
      .where(
        and(
          eq(notifications.userId, user.id),
          eq(notifications.status, 'unread'),
          isNull(notifications.archivedAt)
        )
      )

    return NextResponse.json({
      notifications: items,
      unread_count: unreadItems.length,
    })
  } catch (error) {
    console.error('Failed to get notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a notification
export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      type = 'custom',
      title,
      message,
      imageUrl,
      videoUrl,
      linkUrl,
      linkText,
      metadata,
      pageId,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const id = ulid()
    const now = new Date()

    const [notification] = await db.insert(notifications).values({
      id,
      userId: user.id,
      type,
      title,
      message,
      imageUrl,
      videoUrl,
      linkUrl,
      linkText,
      metadata: metadata || {},
      pageId,
      status: 'unread',
      createdAt: now,
    }).returning()

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('Failed to create notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
