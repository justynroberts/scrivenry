// MIT License - Copyright (c) fintonlabs.com
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, apiKeys } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createHash } from 'crypto'

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

// POST - Move page to new parent
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { parent_id } = body

    // Get the page
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, id),
    })

    if (!page || page.deletedAt) {
      return NextResponse.json(
        { error: 'Not found', message: 'Page not found' },
        { status: 404 }
      )
    }

    // Prevent moving to self
    if (parent_id === id) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Cannot move page to itself' },
        { status: 400 }
      )
    }

    // Calculate new path and depth
    let newPath: string[] = []
    let newDepth = 0

    if (parent_id) {
      const parent = await db.query.pages.findFirst({
        where: eq(pages.id, parent_id),
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

      newPath = [...(parent.path || []), parent.id]
      newDepth = (parent.depth || 0) + 1
    }

    // Update the page
    const [updatedPage] = await db
      .update(pages)
      .set({
        parentId: parent_id || null,
        path: newPath,
        depth: newDepth,
        updatedAt: new Date(),
        lastEditedBy: auth.userId,
      })
      .where(eq(pages.id, id))
      .returning()

    return NextResponse.json({
      page: {
        id: updatedPage.id,
        workspace_id: updatedPage.workspaceId,
        parent_id: updatedPage.parentId,
        title: updatedPage.title,
        icon: updatedPage.icon,
        path: updatedPage.path,
        depth: updatedPage.depth,
        updated_at: updatedPage.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('API v1 POST /pages/[id]/move error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
