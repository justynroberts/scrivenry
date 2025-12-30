import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { pageTags, tags } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { ulid } from 'ulid'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: pageId } = await params

    // Get all page-tag associations for this page
    const pageTagLinks = await db.query.pageTags.findMany({
      where: eq(pageTags.pageId, pageId),
    })

    // Get the full tag data
    const tagList = await Promise.all(
      pageTagLinks.map(async (pt) => {
        return db.query.tags.findFirst({
          where: eq(tags.id, pt.tagId),
        })
      })
    )

    return NextResponse.json({
      tags: tagList.filter(Boolean),
    })
  } catch (error) {
    console.error('Failed to get page tags:', error)
    return NextResponse.json({ error: 'Failed to get page tags' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: pageId } = await params
    const { tagId } = await request.json()

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID required' }, { status: 400 })
    }

    // Check if already associated
    const existing = await db.query.pageTags.findFirst({
      where: and(
        eq(pageTags.pageId, pageId),
        eq(pageTags.tagId, tagId)
      ),
    })

    if (existing) {
      return NextResponse.json({ pageTag: existing })
    }

    const id = ulid()
    const [pageTag] = await db.insert(pageTags).values({
      id,
      pageId,
      tagId,
    }).returning()

    return NextResponse.json({ pageTag })
  } catch (error) {
    console.error('Failed to add tag to page:', error)
    return NextResponse.json({ error: 'Failed to add tag' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: pageId } = await params
    const { tagId } = await request.json()

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID required' }, { status: 400 })
    }

    await db.delete(pageTags).where(
      and(
        eq(pageTags.pageId, pageId),
        eq(pageTags.tagId, tagId)
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove tag from page:', error)
    return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 })
  }
}
