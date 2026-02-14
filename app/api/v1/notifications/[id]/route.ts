import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifications, apiKeys } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createHash } from 'crypto'

// API Key validation
async function validateApiKey(request: NextRequest): Promise<{ userId: string } | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)
  const prefix = token.slice(0, 8)
  const keyHash = createHash('sha256').update(token).digest('hex')

  const apiKey = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.prefix, prefix), eq(apiKeys.keyHash, keyHash)),
  })

  if (!apiKey) {
    return null
  }

  // Check expiration
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return null
  }

  // Update last used
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id))

  return { userId: apiKey.userId }
}

// GET - Get single notification
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateApiKey(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Valid API key required' },
        { status: 401 }
      )
    }

    const { id } = await params

    const notification = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, id),
        eq(notifications.userId, auth.userId)
      ),
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Not found', message: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        image_url: notification.imageUrl,
        video_url: notification.videoUrl,
        link_url: notification.linkUrl,
        link_text: notification.linkText,
        metadata: notification.metadata,
        page_id: notification.pageId,
        status: notification.status,
        snoozed_until: notification.snoozedUntil?.toISOString() || null,
        created_at: notification.createdAt.toISOString(),
        read_at: notification.readAt?.toISOString() || null,
        archived_at: notification.archivedAt?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error('API v1 GET /notifications/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update notification status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateApiKey(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Valid API key required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { action, snoozed_until } = body

    // Verify ownership
    const existing = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, id),
        eq(notifications.userId, auth.userId)
      ),
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Not found', message: 'Notification not found' },
        { status: 404 }
      )
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
        if (!snoozed_until) {
          return NextResponse.json(
            { error: 'Bad request', message: 'snoozed_until is required for snooze action' },
            { status: 400 }
          )
        }
        updates = { status: 'snoozed', snoozedUntil: new Date(snoozed_until) }
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
        return NextResponse.json(
          { error: 'Bad request', message: 'Invalid action. Use: read, unread, snooze, accept, archive, unarchive' },
          { status: 400 }
        )
    }

    const [updated] = await db.update(notifications)
      .set(updates)
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, auth.userId)
      ))
      .returning()

    return NextResponse.json({
      notification: {
        id: updated.id,
        type: updated.type,
        title: updated.title,
        message: updated.message,
        image_url: updated.imageUrl,
        video_url: updated.videoUrl,
        link_url: updated.linkUrl,
        link_text: updated.linkText,
        metadata: updated.metadata,
        page_id: updated.pageId,
        status: updated.status,
        snoozed_until: updated.snoozedUntil?.toISOString() || null,
        created_at: updated.createdAt.toISOString(),
        read_at: updated.readAt?.toISOString() || null,
        archived_at: updated.archivedAt?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error('API v1 PATCH /notifications/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Permanently delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateApiKey(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Valid API key required' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify ownership
    const existing = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, id),
        eq(notifications.userId, auth.userId)
      ),
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Not found', message: 'Notification not found' },
        { status: 404 }
      )
    }

    await db.delete(notifications)
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, auth.userId)
      ))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API v1 DELETE /notifications/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
