import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  workspaces,
  users,
  pages,
  blocks,
  pageVersions,
  favorites,
  tags,
  pageTags,
  apiKeys,
  publicShares,
  recentViews
} from '@/lib/db/schema'

const BACKUP_VERSION = '1.0.0'

export async function GET() {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Export all data
    const [
      allWorkspaces,
      allUsers,
      allPages,
      allBlocks,
      allPageVersions,
      allFavorites,
      allTags,
      allPageTags,
      allApiKeys,
      allPublicShares,
      allRecentViews,
    ] = await Promise.all([
      db.select().from(workspaces),
      db.select().from(users),
      db.select().from(pages),
      db.select().from(blocks),
      db.select().from(pageVersions),
      db.select().from(favorites),
      db.select().from(tags),
      db.select().from(pageTags),
      db.select().from(apiKeys),
      db.select().from(publicShares),
      db.select().from(recentViews),
    ])

    // Sanitize user data - include password hash for restore capability
    const sanitizedUsers = allUsers.map(u => ({
      ...u,
      // Keep passwordHash for restore, but note this is sensitive data
    }))

    // Sanitize API keys - exclude the actual hash (can't be restored, user must create new ones)
    const sanitizedApiKeys = allApiKeys.map(k => ({
      id: k.id,
      userId: k.userId,
      name: k.name,
      prefix: k.prefix,
      scopes: k.scopes,
      expiresAt: k.expiresAt,
      createdAt: k.createdAt,
      // keyHash excluded - API keys can't be restored, user must create new ones
    }))

    const backup = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      exportedBy: user.id,
      data: {
        workspaces: allWorkspaces,
        users: sanitizedUsers,
        pages: allPages,
        blocks: allBlocks,
        pageVersions: allPageVersions,
        favorites: allFavorites,
        tags: allTags,
        pageTags: allPageTags,
        apiKeys: sanitizedApiKeys,
        publicShares: allPublicShares,
        recentViews: allRecentViews,
      },
      stats: {
        workspaces: allWorkspaces.length,
        users: allUsers.length,
        pages: allPages.length,
        blocks: allBlocks.length,
        pageVersions: allPageVersions.length,
        favorites: allFavorites.length,
        tags: allTags.length,
        pageTags: allPageTags.length,
        apiKeys: allApiKeys.length,
        publicShares: allPublicShares.length,
        recentViews: allRecentViews.length,
      }
    }

    const filename = `scrivenry-backup-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 })
  }
}
