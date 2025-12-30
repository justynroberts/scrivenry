import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { ulid } from 'ulid'
import { createHash, randomBytes } from 'crypto'

export async function GET() {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const keys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, user.id),
      orderBy: [desc(apiKeys.createdAt)],
    })

    return NextResponse.json({
      keys: keys.map(key => ({
        id: key.id,
        name: key.name,
        prefix: key.prefix,
        createdAt: key.createdAt.toISOString(),
        lastUsedAt: key.lastUsedAt?.toISOString() || null,
        expiresAt: key.expiresAt?.toISOString() || null,
      })),
    })
  } catch (error) {
    console.error('Failed to get API keys:', error)
    return NextResponse.json(
      { error: 'Failed to get API keys' },
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

    const { name, expiresIn } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Generate API key
    const keyBytes = randomBytes(32)
    const key = `nf_sk_${keyBytes.toString('hex')}`
    const prefix = key.slice(0, 8)
    const keyHash = createHash('sha256').update(key).digest('hex')

    // Calculate expiration
    let expiresAt: Date | undefined
    if (expiresIn === '30d') {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    } else if (expiresIn === '90d') {
      expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    } else if (expiresIn === '1y') {
      expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }

    const id = ulid()
    const now = new Date()

    const [newKey] = await db.insert(apiKeys).values({
      id,
      userId: user.id,
      name,
      keyHash,
      prefix,
      expiresAt,
      createdAt: now,
    }).returning()

    return NextResponse.json({
      key, // Only returned once
      apiKey: {
        id: newKey.id,
        name: newKey.name,
        prefix: newKey.prefix,
        createdAt: newKey.createdAt.toISOString(),
        expiresAt: newKey.expiresAt?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error('Failed to create API key:', error)
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}
