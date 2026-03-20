import { NextResponse } from 'next/server'
import { validateRequest, hashPassword } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, pages, workspaces } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import { ulid } from 'ulid'
import { logAdminAction } from '@/lib/admin-audit'

// GET /api/admin/users — List all users with page count
export async function GET() {
  const { user } = await validateRequest()
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const allUsers = await db.query.users.findMany({
    orderBy: (u, { desc }) => [desc(u.createdAt)],
  })

  // Get page counts per user (via createdBy)
  const pageCounts = await db
    .select({ createdBy: pages.createdBy, count: count() })
    .from(pages)
    .groupBy(pages.createdBy)

  const pageCountMap: Record<string, number> = {}
  for (const row of pageCounts) {
    if (row.createdBy) pageCountMap[row.createdBy] = row.count
  }

  const result = allUsers.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar,
    isAdmin: u.isAdmin,
    isActive: u.isActive,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    lastActiveAt: u.lastActiveAt,
    pageCount: pageCountMap[u.id] ?? 0,
  }))

  return NextResponse.json({ users: result })
}

// POST /api/admin/users — Create a new user
export async function POST(request: Request) {
  const { user } = await validateRequest()
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { email, name, password, isAdmin: makeAdmin = false } = body

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Check for existing user
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  })
  if (existing) {
    return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 })
  }

  // Generate temp password if not provided
  const tempPassword = password || generateTempPassword()
  const passwordHash = await hashPassword(tempPassword)
  const userId = ulid()
  const now = new Date()

  await db.insert(users).values({
    id: userId,
    email: email.toLowerCase(),
    name: name || null,
    passwordHash,
    isAdmin: makeAdmin,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  })

  // Log the action
  await logAdminAction(user.id, 'user_created', 'user', userId, {
    email: email.toLowerCase(),
    name,
    isAdmin: makeAdmin,
    createdBy: user.email,
  })

  const newUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  return NextResponse.json({
    user: {
      id: newUser!.id,
      email: newUser!.email,
      name: newUser!.name,
      isAdmin: newUser!.isAdmin,
      isActive: newUser!.isActive,
      createdAt: newUser!.createdAt,
    },
    temporaryPassword: password ? undefined : tempPassword,
  }, { status: 201 })
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < 12; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)]
  }
  return pass
}
