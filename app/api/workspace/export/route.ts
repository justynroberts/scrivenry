import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { pages } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getDefaultWorkspaceForUser } from '@/lib/db/tenancy'

// GET - Export user's workspace as JSON (tenant-isolated)
export async function GET() {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TENANT ISOLATION: only export the user's own workspace
    const workspace = await getDefaultWorkspaceForUser(user.id)

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get only this user's pages (createdBy + in their workspace)
    const userPages = await db.query.pages.findMany({
      where: and(
        eq(pages.workspaceId, workspace.id),
        eq(pages.createdBy, user.id),
        isNull(pages.deletedAt)
      ),
    })

    const exportData = {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        createdAt: workspace.createdAt,
      },
      pages: userPages.map(page => ({
        id: page.id,
        title: page.title,
        icon: page.icon,
        cover: page.cover,
        content: page.content,
        parentId: page.parentId,
        position: page.position,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      })),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }

    const filename = workspace.name.replace(/[^a-z0-9]/gi, '-') + '-export-' + new Date().toISOString().split('T')[0] + '.json'

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting workspace:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
