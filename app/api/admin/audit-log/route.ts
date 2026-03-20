import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { adminAuditLog, users } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const { user } = await validateRequest()
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const logs = await db.query.adminAuditLog.findMany({
    orderBy: [desc(adminAuditLog.createdAt)],
    limit,
    offset,
  })

  // Enrich with admin user info
  const enriched = await Promise.all(
    logs.map(async (log) => {
      const admin = await db.query.users.findFirst({
        where: eq(users.id, log.adminId),
        columns: { id: true, email: true, name: true },
      })
      return {
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        details: log.details,
        createdAt: log.createdAt,
        admin: admin
          ? { id: admin.id, email: admin.email, name: admin.name }
          : { id: log.adminId, email: 'Unknown', name: null },
      }
    })
  )

  return NextResponse.json({ log: enriched, limit, offset })
}
