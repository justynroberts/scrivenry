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

    const { pageIds } = await request.json()

    if (!Array.isArray(pageIds)) {
      return NextResponse.json(
        { error: 'pageIds must be an array' },
        { status: 400 }
      )
    }

    // Update position for each page
    for (let i = 0; i < pageIds.length; i++) {
      await db
        .update(pages)
        .set({ position: i, updatedAt: new Date() })
        .where(eq(pages.id, pageIds[i]))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reorder pages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
