import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { tags, pageTags } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { ulid } from 'ulid'

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
    }

    const allTags = await db.query.tags.findMany({
      where: eq(tags.workspaceId, workspaceId),
    })

    return NextResponse.json({ tags: allTags })
  } catch (error) {
    console.error('Failed to get tags:', error)
    return NextResponse.json({ error: 'Failed to get tags' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId, name, color } = body

    if (!workspaceId || !name) {
      return NextResponse.json({ error: 'Workspace ID and name required' }, { status: 400 })
    }

    const tagId = ulid()
    const [newTag] = await db.insert(tags).values({
      id: tagId,
      workspaceId,
      name,
      color: color || '#8b5cf6',
    }).returning()

    return NextResponse.json({ tag: newTag })
  } catch (error) {
    console.error('Failed to create tag:', error)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tagId } = await request.json()

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID required' }, { status: 400 })
    }

    // Delete page-tag associations first
    await db.delete(pageTags).where(eq(pageTags.tagId, tagId))

    // Delete the tag
    await db.delete(tags).where(eq(tags.id, tagId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete tag:', error)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}
