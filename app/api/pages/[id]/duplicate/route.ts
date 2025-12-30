import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { pages, Page } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { ulid } from 'ulid'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

async function duplicatePageRecursive(
  page: Page,
  newParentId: string | null,
  userId: string,
  idMapping: Map<string, string>
): Promise<Page[]> {
  const newId = ulid()
  idMapping.set(page.id, newId)
  const now = new Date()

  // Calculate new path
  let newPath: string[] = []
  let newDepth = 0
  if (newParentId) {
    const parent = await db.query.pages.findFirst({
      where: eq(pages.id, newParentId),
    })
    if (parent) {
      newPath = [...(parent.path || []), parent.id]
      newDepth = (parent.depth || 0) + 1
    }
  }

  // Get position among siblings
  const siblings = await db.query.pages.findMany({
    where: newParentId
      ? and(eq(pages.parentId, newParentId), isNull(pages.deletedAt))
      : and(eq(pages.workspaceId, page.workspaceId), isNull(pages.parentId), isNull(pages.deletedAt)),
  })
  const position = siblings.length

  const [newPage] = await db.insert(pages).values({
    id: newId,
    workspaceId: page.workspaceId,
    parentId: newParentId,
    title: newParentId === page.parentId ? `${page.title} (Copy)` : page.title,
    icon: page.icon,
    cover: page.cover,
    path: newPath,
    depth: newDepth,
    position,
    content: page.content,
    properties: page.properties,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    lastEditedBy: userId,
  }).returning()

  const duplicatedPages: Page[] = [newPage]

  // Get and duplicate children
  const children = await db.query.pages.findMany({
    where: and(eq(pages.parentId, page.id), isNull(pages.deletedAt)),
  })

  for (const child of children) {
    const childDuplicates = await duplicatePageRecursive(child, newId, userId, idMapping)
    duplicatedPages.push(...childDuplicates)
  }

  return duplicatedPages
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Parse request body for options
    let includeSubpages = false
    try {
      const body = await request.json()
      includeSubpages = body.includeSubpages || false
    } catch {
      // No body or invalid JSON, use defaults
    }

    const page = await db.query.pages.findFirst({
      where: eq(pages.id, id),
    })

    if (!page || page.deletedAt) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    if (includeSubpages) {
      // Duplicate page with all subpages
      const idMapping = new Map<string, string>()
      const duplicatedPages = await duplicatePageRecursive(page, page.parentId, user.id, idMapping)
      return NextResponse.json({
        page: duplicatedPages[0],
        allPages: duplicatedPages,
        count: duplicatedPages.length
      })
    } else {
      // Simple duplicate (original behavior)
      const siblings = await db.query.pages.findMany({
        where: page.parentId
          ? and(eq(pages.parentId, page.parentId), isNull(pages.deletedAt))
          : and(eq(pages.workspaceId, page.workspaceId), isNull(pages.parentId), isNull(pages.deletedAt)),
      })
      const position = siblings.length

      const newId = ulid()
      const now = new Date()

      const [newPage] = await db.insert(pages).values({
        id: newId,
        workspaceId: page.workspaceId,
        parentId: page.parentId,
        title: `${page.title} (Copy)`,
        icon: page.icon,
        cover: page.cover,
        path: page.path,
        depth: page.depth,
        position,
        content: page.content,
        properties: page.properties,
        createdAt: now,
        updatedAt: now,
        createdBy: user.id,
        lastEditedBy: user.id,
      }).returning()

      return NextResponse.json({ page: newPage })
    }
  } catch (error) {
    console.error('Failed to duplicate page:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate page' },
      { status: 500 }
    )
  }
}
