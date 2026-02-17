// MIT License - Copyright (c) fintonlabs.com

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publicShares, pages } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params

    // Find the share
    const share = await db.query.publicShares.findFirst({
      where: eq(publicShares.id, shareId),
    })

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    // Check if expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Share has expired' }, { status: 410 })
    }

    // Get the page (ensure not deleted)
    const page = await db.query.pages.findFirst({
      where: and(
        eq(pages.id, share.pageId),
        isNull(pages.deletedAt)
      ),
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Return page data (read-only, without sensitive info)
    return NextResponse.json({
      page: {
        id: page.id,
        title: page.title,
        icon: page.icon,
        cover: page.cover,
        content: page.content,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      },
      share: {
        id: share.id,
        allowEditing: share.allowEditing,
        expiresAt: share.expiresAt,
      },
    })
  } catch (error) {
    console.error('Failed to get public page:', error)
    return NextResponse.json({ error: 'Failed to get page' }, { status: 500 })
  }
}
