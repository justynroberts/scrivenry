import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  workspaces,
  pages,
  favorites,
  tags,
  pageTags,
  apiKeys,
  publicShares,
  recentViews
} from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getDefaultWorkspaceForUser } from '@/lib/db/tenancy'

const BACKUP_VERSION = '1.0.0'

export async function GET() {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TENANT ISOLATION: only export the current user's data
    const userWorkspace = await getDefaultWorkspaceForUser(user.id)

    // Get user's workspace(s)
    const userWorkspaces = userWorkspace ? [userWorkspace] : []
    const workspaceIds = userWorkspaces.map(w => w.id)

    // Get user's pages
    const userPages = workspaceIds.length > 0
      ? await db.query.pages.findMany({
          where: eq(pages.createdBy, user.id),
        })
      : []

    const pageIds = userPages.map(p => p.id)

    // Get tags from user's workspace(s)
    const userTags = workspaceIds.length > 0
      ? await db.select().from(tags).where(eq(tags.workspaceId, workspaceIds[0]))
      : []

    const tagIds = userTags.map(t => t.id)

    // Get page-tag associations for user's pages
    const userPageTags = pageIds.length > 0
      ? await db.select().from(pageTags).where(eq(pageTags.pageId, pageIds[0]))
      : []

    // Get user's favorites
    const userFavorites = await db.select().from(favorites).where(eq(favorites.userId, user.id))

    // Get user's API keys (without hash - user must recreate)
    const userApiKeys = await db.select({
      id: apiKeys.id,
      userId: apiKeys.userId,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      scopes: apiKeys.scopes,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    }).from(apiKeys).where(eq(apiKeys.userId, user.id))

    // Get public shares for user's pages
    const userPublicShares = pageIds.length > 0
      ? await db.select().from(publicShares).where(eq(publicShares.createdBy, user.id))
      : []

    // Get recent views for this user
    const userRecentViews = await db.select().from(recentViews).where(eq(recentViews.userId, user.id))

    const backup = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      exportedBy: user.id,
      exportedByEmail: user.email,
      data: {
        workspaces: userWorkspaces,
        pages: userPages,
        favorites: userFavorites,
        tags: userTags,
        pageTags: userPageTags,
        apiKeys: userApiKeys,
        publicShares: userPublicShares,
        recentViews: userRecentViews,
      },
      stats: {
        workspaces: userWorkspaces.length,
        pages: userPages.length,
        favorites: userFavorites.length,
        tags: userTags.length,
        pageTags: userPageTags.length,
        apiKeys: userApiKeys.length,
        publicShares: userPublicShares.length,
        recentViews: userRecentViews.length,
      },
    }

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="' + user.email.split('@')[0] + '-backup-' + new Date().toISOString().split('T')[0] + '.json"',
      },
    })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json(
      { error: 'Failed to create backup', details: String(error) },
      { status: 500 }
    )
  }
}
