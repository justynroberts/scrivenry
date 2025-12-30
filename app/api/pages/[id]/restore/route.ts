import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { pages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const page = await db.query.pages.findFirst({
      where: eq(pages.id, id),
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    if (!page.deletedAt) {
      return NextResponse.json({ error: 'Page is not in trash' }, { status: 400 })
    }

    // Restore the page
    const [restoredPage] = await db
      .update(pages)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, id))
      .returning()

    return NextResponse.json({ page: restoredPage })
  } catch (error) {
    console.error('Failed to restore page:', error)
    return NextResponse.json(
      { error: 'Failed to restore page' },
      { status: 500 }
    )
  }
}
