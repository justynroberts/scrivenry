import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { recentViews, pages } from '@/lib/db/schema'
import { eq, desc, and, isNull } from 'drizzle-orm'
import { ulid } from 'ulid'

export async function GET() {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get recent views with page details
    const views = await db
      .select({
        id: recentViews.id,
        viewedAt: recentViews.viewedAt,
        page: {
          id: pages.id,
          title: pages.title,
          icon: pages.icon,
        },
      })
      .from(recentViews)
      .innerJoin(pages, eq(recentViews.pageId, pages.id))
      .where(and(
        eq(recentViews.userId, user.id),
        isNull(pages.deletedAt)
      ))
      .orderBy(desc(recentViews.viewedAt))
      .limit(10)

    return NextResponse.json({ recentPages: views })
  } catch (error) {
    console.error('Failed to get recent pages:', error)
    return NextResponse.json({ error: 'Failed to get recent pages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { pageId } = body

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID required' }, { status: 400 })
    }

    // Delete existing view for this page
    await db.delete(recentViews).where(
      and(
        eq(recentViews.userId, user.id),
        eq(recentViews.pageId, pageId)
      )
    )

    // Insert new view
    const viewId = ulid()
    await db.insert(recentViews).values({
      id: viewId,
      userId: user.id,
      pageId,
      viewedAt: new Date(),
    })

    // Keep only last 20 views per user
    const allViews = await db.query.recentViews.findMany({
      where: eq(recentViews.userId, user.id),
      orderBy: [desc(recentViews.viewedAt)],
    })

    if (allViews.length > 20) {
      const toDelete = allViews.slice(20).map(v => v.id)
      for (const id of toDelete) {
        await db.delete(recentViews).where(eq(recentViews.id, id))
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to record view:', error)
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 })
  }
}
