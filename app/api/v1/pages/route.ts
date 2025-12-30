import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, apiKeys } from '@/lib/db/schema'
import { eq, isNull, and, desc } from 'drizzle-orm'
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
    const workspaceId = searchParams.get('workspace_id')
    const parentId = searchParams.get('parent_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const cursor = searchParams.get('cursor')

    let whereClause = isNull(pages.deletedAt)

    if (workspaceId) {
      whereClause = and(whereClause, eq(pages.workspaceId, workspaceId))!
    }

    if (parentId === 'null') {
      whereClause = and(whereClause, isNull(pages.parentId))!
    } else if (parentId) {
      whereClause = and(whereClause, eq(pages.parentId, parentId))!
    }

    const allPages = await db.query.pages.findMany({
      where: whereClause,
      orderBy: [desc(pages.createdAt)],
      limit: limit + 1,
    })

    const hasMore = allPages.length > limit
    const resultPages = hasMore ? allPages.slice(0, -1) : allPages
    const nextCursor = hasMore ? resultPages[resultPages.length - 1]?.id : null

    return NextResponse.json({
      pages: resultPages.map(page => ({
        id: page.id,
        workspace_id: page.workspaceId,
        parent_id: page.parentId,
        title: page.title,
        icon: page.icon,
        cover: page.cover,
        path: page.path,
        depth: page.depth,
        position: page.position,
        is_template: page.isTemplate,
        properties: page.properties,
        created_at: page.createdAt.toISOString(),
        updated_at: page.updatedAt.toISOString(),
      })),
      has_more: hasMore,
      next_cursor: nextCursor,
    })
  } catch (error) {
    console.error('API v1 GET /pages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { workspace_id, parent_id, title, icon, properties } = body

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'Bad request', message: 'workspace_id is required' },
        { status: 400 }
      )
    }

    // Get parent info if parent_id provided
    let path: string[] = []
    let depth = 0

    if (parent_id) {
      const parent = await db.query.pages.findFirst({
        where: eq(pages.id, parent_id),
      })
      if (parent) {
        path = [...(parent.path || []), parent.id]
        depth = (parent.depth || 0) + 1
      }
    }

    // Get position
    const siblings = await db.query.pages.findMany({
      where: parent_id
        ? and(eq(pages.parentId, parent_id), isNull(pages.deletedAt))
        : and(eq(pages.workspaceId, workspace_id), isNull(pages.parentId), isNull(pages.deletedAt)),
    })
    const position = siblings.length

    const pageId = ulid()
    const now = new Date()

    const [newPage] = await db.insert(pages).values({
      id: pageId,
      workspaceId: workspace_id,
      parentId: parent_id || null,
      title: title || 'Untitled',
      icon: icon || null,
      path,
      depth,
      position,
      properties: properties || {},
      content: {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      },
      createdAt: now,
      updatedAt: now,
      createdBy: auth.userId,
      lastEditedBy: auth.userId,
    }).returning()

    return NextResponse.json({
      page: {
        id: newPage.id,
        workspace_id: newPage.workspaceId,
        parent_id: newPage.parentId,
        title: newPage.title,
        icon: newPage.icon,
        path: newPage.path,
        depth: newPage.depth,
        position: newPage.position,
        properties: newPage.properties,
        created_at: newPage.createdAt.toISOString(),
        updated_at: newPage.updatedAt.toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('API v1 POST /pages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
