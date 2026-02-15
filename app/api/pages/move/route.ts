// MIT License - Copyright (c) fintonlabs.com
import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { pages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId, newParentId } = await request.json()

    if (!pageId) {
      return NextResponse.json(
        { error: 'pageId is required' },
        { status: 400 }
      )
    }

    // Get the page being moved
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // Calculate new path and depth
    let newPath: string[] = []
    let newDepth = 0

    if (newParentId) {
      // Verify parent exists
      const parent = await db.query.pages.findFirst({
        where: eq(pages.id, newParentId),
      })

      if (!parent) {
        return NextResponse.json(
          { error: 'Parent page not found' },
          { status: 404 }
        )
      }

      // Prevent circular reference
      if (newParentId === pageId) {
        return NextResponse.json(
          { error: 'Cannot make a page its own parent' },
          { status: 400 }
        )
      }

      // Check if newParentId is a descendant of pageId (would create circular)
      if (parent.path?.includes(pageId)) {
        return NextResponse.json(
          { error: 'Cannot move a page under its own descendant' },
          { status: 400 }
        )
      }

      newPath = [...(parent.path || []), parent.id]
      newDepth = (parent.depth || 0) + 1
    }

    // Update the page
    await db
      .update(pages)
      .set({
        parentId: newParentId || null,
        path: newPath,
        depth: newDepth,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, pageId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Move page error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
