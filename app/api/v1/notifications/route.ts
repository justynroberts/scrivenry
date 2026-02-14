import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifications, apiKeys } from '@/lib/db/schema'
import { eq, and, desc, isNull, isNotNull, lte } from 'drizzle-orm'
import { ulid } from 'ulid'
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

// GET - List notifications
export async function GET(request: NextRequest) {
  try {
    const auth = await validateApiKey(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Valid API key required' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // 'unread', 'read', 'snoozed', 'accepted', 'archived', 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const cursor = searchParams.get('cursor')

    let whereClause = eq(notifications.userId, auth.userId)

    if (status && status !== 'all') {
      if (status === 'archived') {
        whereClause = and(whereClause, isNotNull(notifications.archivedAt))!
      } else if (status === 'active') {
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
          eq(notifications.userId, auth.userId),
          eq(notifications.status, 'snoozed'),
          lte(notifications.snoozedUntil, now)
        )
      )

    const items = await db.select().from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit + 1)

    const hasMore = items.length > limit
    const resultItems = hasMore ? items.slice(0, -1) : items
    const nextCursor = hasMore ? resultItems[resultItems.length - 1]?.id : null

    // Count unread
    const unreadItems = await db.select().from(notifications)
      .where(
        and(
          eq(notifications.userId, auth.userId),
          eq(notifications.status, 'unread'),
          isNull(notifications.archivedAt)
        )
      )

    return NextResponse.json({
      notifications: resultItems.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        image_url: n.imageUrl,
        video_url: n.videoUrl,
        link_url: n.linkUrl,
        link_text: n.linkText,
        metadata: n.metadata,
        page_id: n.pageId,
        status: n.status,
        snoozed_until: n.snoozedUntil?.toISOString() || null,
        created_at: n.createdAt.toISOString(),
        read_at: n.readAt?.toISOString() || null,
        archived_at: n.archivedAt?.toISOString() || null,
      })),
      unread_count: unreadItems.length,
      has_more: hasMore,
      next_cursor: nextCursor,
    })
  } catch (error) {
    console.error('API v1 GET /notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create notification
export async function POST(request: NextRequest) {
  try {
    const auth = await validateApiKey(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Valid API key required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      type = 'custom',
      title,
      message,
      image_url,
      video_url,
      link_url,
      link_text,
      metadata,
      page_id,
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Bad request', message: 'title is required' },
        { status: 400 }
      )
    }

    const id = ulid()
    const now = new Date()

    const [notification] = await db.insert(notifications).values({
      id,
      userId: auth.userId,
      type,
      title,
      message,
      imageUrl: image_url,
      videoUrl: video_url,
      linkUrl: link_url,
      linkText: link_text,
      metadata: metadata || {},
      pageId: page_id,
      status: 'unread',
      createdAt: now,
    }).returning()

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
        created_at: notification.createdAt.toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('API v1 POST /notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
