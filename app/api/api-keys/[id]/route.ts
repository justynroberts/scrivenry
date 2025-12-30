import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const key = await db.query.apiKeys.findFirst({
      where: and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id)),
    })

    if (!key) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 })
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete API key:', error)
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    )
  }
}
