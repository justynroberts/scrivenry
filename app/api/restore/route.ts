import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  workspaces,
  users,
  sessions,
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

const SUPPORTED_VERSIONS = ['1.0.0']

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const backup = await request.json()

    // Validate backup format
    if (!backup.version || !backup.data) {
      return NextResponse.json(
        { error: 'Invalid backup format' },
        { status: 400 }
      )
    }

    if (!SUPPORTED_VERSIONS.includes(backup.version)) {
      return NextResponse.json(
        { error: `Unsupported backup version: ${backup.version}` },
        { status: 400 }
      )
    }

    const { data } = backup

    // Clear existing data in reverse dependency order
    // Sessions first (depends on users)
    await db.delete(sessions)
    // Then tables that depend on pages and users
    await db.delete(recentViews)
    await db.delete(publicShares)
    await db.delete(pageTags)
    await db.delete(favorites)
    await db.delete(apiKeys)
    await db.delete(pageVersions)
    await db.delete(blocks)
    // Then pages (self-referential, delete children first is handled by cascade)
    await db.delete(pages)
    // Then tags (depends on workspaces)
    await db.delete(tags)
    // Then users
    await db.delete(users)
    // Finally workspaces
    await db.delete(workspaces)

    // Restore data in dependency order
    const stats = {
      workspaces: 0,
      users: 0,
      pages: 0,
      blocks: 0,
      pageVersions: 0,
      favorites: 0,
      tags: 0,
      pageTags: 0,
      apiKeys: 0,
      publicShares: 0,
      recentViews: 0,
    }

    // 1. Workspaces
    if (data.workspaces?.length > 0) {
      for (const workspace of data.workspaces) {
        await db.insert(workspaces).values({
          ...workspace,
          createdAt: new Date(workspace.createdAt),
          updatedAt: new Date(workspace.updatedAt),
        })
        stats.workspaces++
      }
    }

    // 2. Users
    if (data.users?.length > 0) {
      for (const u of data.users) {
        await db.insert(users).values({
          ...u,
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt),
        })
        stats.users++
      }
    }

    // 3. Tags (depend on workspaces)
    if (data.tags?.length > 0) {
      for (const tag of data.tags) {
        await db.insert(tags).values({
          ...tag,
          createdAt: new Date(tag.createdAt),
        })
        stats.tags++
      }
    }

    // 4. Pages (self-referential - insert parents first)
    if (data.pages?.length > 0) {
      // Sort by depth to ensure parents are created before children
      const sortedPages = [...data.pages].sort((a, b) => (a.depth || 0) - (b.depth || 0))
      for (const page of sortedPages) {
        await db.insert(pages).values({
          ...page,
          createdAt: new Date(page.createdAt),
          updatedAt: new Date(page.updatedAt),
          deletedAt: page.deletedAt ? new Date(page.deletedAt) : null,
        })
        stats.pages++
      }
    }

    // 5. Blocks (depend on pages, self-referential)
    if (data.blocks?.length > 0) {
      // Sort by position to handle parent-child relationships
      const sortedBlocks = [...data.blocks].sort((a, b) => (a.position || 0) - (b.position || 0))
      for (const block of sortedBlocks) {
        await db.insert(blocks).values({
          ...block,
          createdAt: new Date(block.createdAt),
          updatedAt: new Date(block.updatedAt),
        })
        stats.blocks++
      }
    }

    // 6. Page Versions
    if (data.pageVersions?.length > 0) {
      for (const version of data.pageVersions) {
        await db.insert(pageVersions).values({
          ...version,
          createdAt: new Date(version.createdAt),
        })
        stats.pageVersions++
      }
    }

    // 7. Favorites
    if (data.favorites?.length > 0) {
      for (const fav of data.favorites) {
        await db.insert(favorites).values({
          ...fav,
          createdAt: new Date(fav.createdAt),
        })
        stats.favorites++
      }
    }

    // 8. Page Tags
    if (data.pageTags?.length > 0) {
      for (const pt of data.pageTags) {
        await db.insert(pageTags).values({
          ...pt,
          createdAt: new Date(pt.createdAt),
        })
        stats.pageTags++
      }
    }

    // 9. Public Shares
    if (data.publicShares?.length > 0) {
      for (const share of data.publicShares) {
        await db.insert(publicShares).values({
          ...share,
          createdAt: new Date(share.createdAt),
          expiresAt: share.expiresAt ? new Date(share.expiresAt) : null,
        })
        stats.publicShares++
      }
    }

    // 10. Recent Views
    if (data.recentViews?.length > 0) {
      for (const rv of data.recentViews) {
        await db.insert(recentViews).values({
          ...rv,
          viewedAt: new Date(rv.viewedAt),
        })
        stats.recentViews++
      }
    }

    // Note: API keys are NOT restored because we don't have the key hash
    // User will need to create new API keys after restore

    return NextResponse.json({
      success: true,
      message: 'Backup restored successfully',
      stats,
      note: 'API keys were not restored - you will need to create new ones',
    })
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json(
      { error: 'Failed to restore backup', details: String(error) },
      { status: 500 }
    )
  }
}
