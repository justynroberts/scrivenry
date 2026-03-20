import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, pages, workspaces } from '@/lib/db/schema'
import { count, isNull, desc } from 'drizzle-orm'
import { statSync } from 'fs'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getDbSize(): string {
  try {
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './data/scrivenry.db'
    const stat = statSync(dbPath)
    return formatBytes(stat.size)
  } catch {
    return 'Unknown'
  }
}

export async function GET() {
  const { user } = await validateRequest()
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const [
    totalUsersResult,
    totalPagesResult,
    totalWorkspacesResult,
    recentUsers,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(pages).where(isNull(pages.deletedAt)),
    db.select({ count: count() }).from(workspaces),
    db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      limit: 5,
      columns: { id: true, email: true, name: true, createdAt: true, isAdmin: true },
    }),
  ])

  const totalUsers = totalUsersResult[0].count
  const totalPages = totalPagesResult[0].count
  const totalWorkspaces = totalWorkspacesResult[0].count

  return NextResponse.json({
    totalUsers,
    totalPages,
    totalWorkspaces,
    activeWorkspaces: totalWorkspaces,
    storageUsed: getDbSize(),
    recentUsers: recentUsers.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt,
      isAdmin: u.isAdmin,
    })),
  })
}
