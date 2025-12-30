import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { pageVersions, pages } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { ulid } from 'ulid'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const versions = await db.query.pageVersions.findMany({
      where: eq(pageVersions.pageId, id),
      orderBy: [desc(pageVersions.createdAt)],
      limit: 50,
    })

    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Failed to get versions:', error)
    return NextResponse.json({ error: 'Failed to get versions' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get current page content
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, id),
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const body = await request.json()
    const { changeDescription } = body

    const versionId = ulid()
    const [version] = await db.insert(pageVersions).values({
      id: versionId,
      pageId: id,
      content: page.content || {},
      title: page.title,
      createdBy: user.id,
      changeDescription: changeDescription || null,
    }).returning()

    return NextResponse.json({ version })
  } catch (error) {
    console.error('Failed to create version:', error)
    return NextResponse.json({ error: 'Failed to create version' }, { status: 500 })
  }
}
