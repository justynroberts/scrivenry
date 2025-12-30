import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { favorites, pages } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { ulid } from 'ulid'

export async function GET() {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userFavorites = await db.query.favorites.findMany({
      where: eq(favorites.userId, user.id),
    })

    // Get the full page data for each favorite
    const favoritePages = await Promise.all(
      userFavorites.map(async (fav) => {
        const page = await db.query.pages.findFirst({
          where: eq(pages.id, fav.pageId),
        })
        return page
      })
    )

    return NextResponse.json({
      favorites: favoritePages.filter(Boolean),
    })
  } catch (error) {
    console.error('Failed to get favorites:', error)
    return NextResponse.json(
      { error: 'Failed to get favorites' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId } = await request.json()

    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      )
    }

    // Check if already favorited
    const existing = await db.query.favorites.findFirst({
      where: and(
        eq(favorites.userId, user.id),
        eq(favorites.pageId, pageId)
      ),
    })

    if (existing) {
      return NextResponse.json({ favorite: existing })
    }

    const id = ulid()
    const [favorite] = await db.insert(favorites).values({
      id,
      userId: user.id,
      pageId,
    }).returning()

    return NextResponse.json({ favorite })
  } catch (error) {
    console.error('Failed to add favorite:', error)
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId } = await request.json()

    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      )
    }

    await db.delete(favorites).where(
      and(
        eq(favorites.userId, user.id),
        eq(favorites.pageId, pageId)
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove favorite:', error)
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    )
  }
}
