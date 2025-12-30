import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { publicShares } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
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

    const share = await db.query.publicShares.findFirst({
      where: eq(publicShares.pageId, id),
    })

    return NextResponse.json({ share })
  } catch (error) {
    console.error('Failed to get share:', error)
    return NextResponse.json({ error: 'Failed to get share' }, { status: 500 })
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
    const body = await request.json()
    const { allowEditing, expiresIn } = body

    // Check if share already exists
    const existingShare = await db.query.publicShares.findFirst({
      where: eq(publicShares.pageId, id),
    })

    if (existingShare) {
      return NextResponse.json({ share: existingShare })
    }

    const shareId = ulid()
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

    const [share] = await db.insert(publicShares).values({
      id: shareId,
      pageId: id,
      createdBy: user.id,
      allowEditing: allowEditing || false,
      expiresAt,
    }).returning()

    return NextResponse.json({ share })
  } catch (error) {
    console.error('Failed to create share:', error)
    return NextResponse.json({ error: 'Failed to create share' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await db.delete(publicShares).where(eq(publicShares.pageId, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete share:', error)
    return NextResponse.json({ error: 'Failed to delete share' }, { status: 500 })
  }
}
