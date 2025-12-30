import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, apiKeys } from '@/lib/db/schema'
import { eq, and, isNull, like, or } from 'drizzle-orm'
import { createHash } from 'crypto'

async function validateApiKey(request: NextRequest): Promise<{ userId: string } | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)
  const prefix = token.slice(0, 8)
  const keyHash = createHash('sha256').update(token).digest('hex')

  const apiKey = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.prefix, prefix), eq(apiKeys.keyHash, keyHash)),
  })

  if (!apiKey) {
    return null
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return null
  }

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id))

  return { userId: apiKey.userId }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await validateApiKey(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Valid API key required' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const workspaceId = searchParams.get('workspace_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    if (!query) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Query parameter q is required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Simple LIKE-based search (FTS5 would be better but requires setup)
    const searchPattern = `%${query}%`

    let whereClause = and(
      isNull(pages.deletedAt),
      or(
        like(pages.title, searchPattern)
      )
    )

    if (workspaceId) {
      whereClause = and(whereClause, eq(pages.workspaceId, workspaceId))!
    }

    const results = await db.query.pages.findMany({
      where: whereClause,
      limit,
    })

    const took = Date.now() - startTime

    return NextResponse.json({
      results: results.map(page => ({
        type: 'page',
        id: page.id,
        title: page.title,
        icon: page.icon,
        path: page.path,
        workspace_id: page.workspaceId,
        highlight: highlightMatch(page.title, query),
        score: calculateScore(page.title, query),
      })),
      total: results.length,
      took_ms: took,
    })
  } catch (error) {
    console.error('API v1 GET /search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function highlightMatch(text: string, query: string): string {
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

function calculateScore(text: string, query: string): number {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()

  // Exact match
  if (lowerText === lowerQuery) return 1.0

  // Starts with
  if (lowerText.startsWith(lowerQuery)) return 0.9

  // Contains
  if (lowerText.includes(lowerQuery)) return 0.7

  return 0.5
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
