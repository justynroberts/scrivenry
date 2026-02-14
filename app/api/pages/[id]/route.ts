import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { pages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { pageEvents } from '@/lib/events'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const page = await db.query.pages.findFirst({
      where: eq(pages.id, id),
    })

    if (!page || page.deletedAt) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Failed to get page:', error)
    return NextResponse.json(
      { error: 'Failed to get page' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, icon, cover, content, properties } = body

    const page = await db.query.pages.findFirst({
      where: eq(pages.id, id),
    })

    if (!page || page.deletedAt) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const updates: Partial<typeof pages.$inferInsert> = {
      updatedAt: new Date(),
      lastEditedBy: user.id,
    }

    if (title !== undefined) updates.title = title
    if (icon !== undefined) updates.icon = icon
    if (cover !== undefined) updates.cover = cover
    if (content !== undefined) updates.content = content
    if (properties !== undefined) updates.properties = properties

    const [updatedPage] = await db
      .update(pages)
      .set(updates)
      .where(eq(pages.id, id))
      .returning()

    // Emit event for real-time updates
    pageEvents.emit(id, updatedPage.updatedAt.toISOString())

    return NextResponse.json({ page: updatedPage })
  } catch (error) {
    console.error('Failed to update page:', error)
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const permanent = searchParams.get('permanent') === 'true'

    const page = await db.query.pages.findFirst({
      where: eq(pages.id, id),
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    if (permanent) {
      // Permanent delete
      await db.delete(pages).where(eq(pages.id, id))
    } else {
      // Soft delete
      await db
        .update(pages)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(pages.id, id))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete page:', error)
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    )
  }
}
