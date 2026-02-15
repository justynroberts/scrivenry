import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, apiKeys } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createHash } from 'crypto'
import { pageEvents } from '@/lib/events'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

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

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return null
  }

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id))

  return { userId: apiKey.userId }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await validateApiKey(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Valid API key required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const includeBlocks = searchParams.get('include_blocks') === 'true'

    const page = await db.query.pages.findFirst({
      where: eq(pages.id, id),
    })

    if (!page || page.deletedAt) {
      return NextResponse.json(
        { error: 'Not found', message: 'Page not found' },
        { status: 404 }
      )
    }

    const response: Record<string, unknown> = {
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
    }

    if (includeBlocks) {
      response.content = page.content
    }

    return NextResponse.json({ page: response })
  } catch (error) {
    console.error('API v1 GET /pages/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const page = await db.query.pages.findFirst({
      where: eq(pages.id, id),
    })

    if (!page || page.deletedAt) {
      return NextResponse.json(
        { error: 'Not found', message: 'Page not found' },
        { status: 404 }
      )
    }

    const updates: Partial<typeof pages.$inferInsert> = {
      updatedAt: new Date(),
      lastEditedBy: auth.userId,
    }

    if (body.title !== undefined) updates.title = body.title
    if (body.icon !== undefined) updates.icon = body.icon
    if (body.cover !== undefined) updates.cover = body.cover
    if (body.content !== undefined) updates.content = body.content
    if (body.properties !== undefined) updates.properties = body.properties

    // Handle parent_id changes (moving pages)
    if (body.parent_id !== undefined) {
      const newParentId = body.parent_id

      // Prevent moving to self
      if (newParentId === id) {
        return NextResponse.json(
          { error: 'Bad request', message: 'Cannot move page to itself' },
          { status: 400 }
        )
      }

      if (newParentId) {
        const parent = await db.query.pages.findFirst({
          where: eq(pages.id, newParentId),
        })

        if (!parent) {
          return NextResponse.json(
            { error: 'Bad request', message: 'Parent page not found' },
            { status: 400 }
          )
        }

        // Prevent circular reference
        if (parent.path?.includes(id)) {
          return NextResponse.json(
            { error: 'Bad request', message: 'Cannot move page to its own descendant' },
            { status: 400 }
          )
        }

        updates.parentId = newParentId
        updates.path = [...(parent.path || []), parent.id]
        updates.depth = (parent.depth || 0) + 1
      } else {
        // Moving to root
        updates.parentId = null
        updates.path = []
        updates.depth = 0
      }
    }

    const [updatedPage] = await db
      .update(pages)
      .set(updates)
      .where(eq(pages.id, id))
      .returning()

    // Emit event for real-time updates
    pageEvents.emit(id, updatedPage.updatedAt.toISOString())

    return NextResponse.json({
      page: {
        id: updatedPage.id,
        workspace_id: updatedPage.workspaceId,
        parent_id: updatedPage.parentId,
        title: updatedPage.title,
        icon: updatedPage.icon,
        cover: updatedPage.cover,
        path: updatedPage.path,
        properties: updatedPage.properties,
        updated_at: updatedPage.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('API v1 PATCH /pages/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await validateApiKey(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Valid API key required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const permanent = searchParams.get('permanent') === 'true'

    const page = await db.query.pages.findFirst({
      where: eq(pages.id, id),
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Not found', message: 'Page not found' },
        { status: 404 }
      )
    }

    if (permanent) {
      await db.delete(pages).where(eq(pages.id, id))
    } else {
      await db
        .update(pages)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(pages.id, id))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API v1 DELETE /pages/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
