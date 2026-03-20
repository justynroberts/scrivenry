import { NextResponse } from 'next/server'
import { validateRequest, hashPassword } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logAdminAction } from '@/lib/admin-audit'

// GET /api/admin/users/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await validateRequest()
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const target = await db.query.users.findFirst({
    where: eq(users.id, id),
  })

  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    user: {
      id: target.id,
      email: target.email,
      name: target.name,
      avatar: target.avatar,
      isAdmin: target.isAdmin,
      isActive: target.isActive,
      createdAt: target.createdAt,
      updatedAt: target.updatedAt,
      lastActiveAt: target.lastActiveAt,
    },
  })
}

// PUT /api/admin/users/[id] — Update user (isAdmin, isActive, resetPassword)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await validateRequest()
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { isAdmin: makeAdmin, isActive, resetPassword, newPassword } = body

  // Prevent self-demotion
  if (id === user.id && makeAdmin === false) {
    return NextResponse.json({ error: 'Cannot remove your own admin status' }, { status: 400 })
  }

  const target = await db.query.users.findFirst({
    where: eq(users.id, id),
  })

  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const updates: Partial<typeof target> = {
    updatedAt: new Date(),
  }

  if (typeof makeAdmin === 'boolean') {
    updates.isAdmin = makeAdmin
    await logAdminAction(
      user.id,
      makeAdmin ? 'admin_granted' : 'admin_revoked',
      'user',
      id,
      { targetEmail: target.email }
    )
  }

  if (typeof isActive === 'boolean') {
    updates.isActive = isActive
    await logAdminAction(
      user.id,
      isActive ? 'user_activated' : 'user_deactivated',
      'user',
      id,
      { targetEmail: target.email }
    )
  }

  let tempPassword: string | undefined
  if (resetPassword) {
    tempPassword = (newPassword as string | undefined) || generateTempPassword()
    updates.passwordHash = await hashPassword(tempPassword)
    await logAdminAction(user.id, 'password_reset', 'user', id, {
      targetEmail: target.email,
      resetBy: user.email,
    })
  }

  await db.update(users).set(updates).where(eq(users.id, id))

  const updated = await db.query.users.findFirst({
    where: eq(users.id, id),
  })

  return NextResponse.json({
    user: {
      id: updated!.id,
      email: updated!.email,
      name: updated!.name,
      isAdmin: updated!.isAdmin,
      isActive: updated!.isActive,
      updatedAt: updated!.updatedAt,
    },
    temporaryPassword: resetPassword && !newPassword ? tempPassword : undefined,
  })
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await validateRequest()
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params

  if (id === user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const target = await db.query.users.findFirst({
    where: eq(users.id, id),
  })

  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  await logAdminAction(user.id, 'user_deleted', 'user', id, {
    targetEmail: target.email,
    targetName: target.name,
    deletedBy: user.email,
  })

  await db.delete(users).where(eq(users.id, id))

  return NextResponse.json({ success: true })
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < 12; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)]
  }
  return pass
}
