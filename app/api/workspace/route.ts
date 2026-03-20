import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { workspaces } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { ulid } from 'ulid'
import { getDefaultWorkspaceForUser } from '@/lib/db/tenancy'

// GET - Get the user's workspace
export async function GET() {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TENANT ISOLATION: only return user's own workspace
    const workspace = await getDefaultWorkspaceForUser(user.id)

    if (!workspace) {
      // Auto-create a workspace for this user if none exists
      const wsId = ulid()
      const now = new Date()
      const emailPrefix = user.email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()
      const slug = `workspace-${emailPrefix}-${wsId.slice(-6).toLowerCase()}`

      const [newWorkspace] = await db.insert(workspaces).values({
        id: wsId,
        name: `${user.name || user.email.split('@')[0]}'s Workspace`,
        slug,
        ownerId: user.id,
        createdAt: now,
        updatedAt: now,
      }).returning()

      return NextResponse.json(newWorkspace)
    }

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error fetching workspace:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update workspace (rename)
export async function PATCH(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // TENANT ISOLATION: only update user's own workspace
    const workspace = await getDefaultWorkspaceForUser(user.id)

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const [updated] = await db
      .update(workspaces)
      .set({ name, updatedAt: new Date() })
      .where(and(eq(workspaces.id, workspace.id), eq(workspaces.ownerId, user.id)))
      .returning()

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating workspace:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
