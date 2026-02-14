import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { pages, notifications } from '@/lib/db/schema'
import { eq, isNull, and, desc } from 'drizzle-orm'
import { ulid } from 'ulid'

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspace_id')
    const parentId = searchParams.get('parent_id')

    let whereClause = isNull(pages.deletedAt)

    if (workspaceId) {
      whereClause = and(whereClause, eq(pages.workspaceId, workspaceId))!
    }

    if (parentId) {
      whereClause = and(whereClause, eq(pages.parentId, parentId))!
    }

    const allPages = await db.query.pages.findMany({
      where: whereClause,
      orderBy: [desc(pages.createdAt)],
    })

    return NextResponse.json({ pages: allPages })
  } catch (error) {
    console.error('Failed to get pages:', error)
    return NextResponse.json(
      { error: 'Failed to get pages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId, parentId, title, icon, content } = body

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    // Get parent info if parentId provided
    let path: string[] = []
    let depth = 0

    if (parentId) {
      const parent = await db.query.pages.findFirst({
        where: eq(pages.id, parentId),
      })
      if (parent) {
        path = [...(parent.path || []), parent.id]
        depth = (parent.depth || 0) + 1
      }
    }

    // Get position
    const siblings = await db.query.pages.findMany({
      where: parentId
        ? and(eq(pages.parentId, parentId), isNull(pages.deletedAt))
        : and(eq(pages.workspaceId, workspaceId), isNull(pages.parentId), isNull(pages.deletedAt)),
    })
    const position = siblings.length

    const pageId = ulid()
    const now = new Date()

    const [newPage] = await db.insert(pages).values({
      id: pageId,
      workspaceId,
      parentId: parentId || null,
      title: title || 'Untitled',
      icon: icon || null,
      path,
      depth,
      position,
      content: content || {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      },
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
      lastEditedBy: user.id,
    }).returning()

    // Create notification for page creation
    await db.insert(notifications).values({
      id: ulid(),
      userId: user.id,
      type: 'page_created',
      title: 'New page created',
      message: `"${newPage.title}" was created`,
      pageId: newPage.id,
      linkUrl: `/page/${newPage.id}`,
      linkText: 'View page',
      status: 'unread',
      createdAt: now,
    })

    return NextResponse.json({ page: newPage })
  } catch (error) {
    console.error('Failed to create page:', error)
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    )
  }
}
