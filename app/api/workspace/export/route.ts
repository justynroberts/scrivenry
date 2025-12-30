import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { workspaces, pages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET - Export entire workspace as JSON
export async function GET() {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await db.query.workspaces.findFirst()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get all pages (excluding deleted)
    const allPages = await db.query.pages.findMany({
      where: eq(pages.workspaceId, workspace.id),
    })

    // Filter out deleted pages
    const activePages = allPages.filter(page => !page.deletedAt)

    // Build export data
    const exportData = {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        createdAt: workspace.createdAt,
      },
      pages: activePages.map(page => ({
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

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${workspace.name.replace(/[^a-z0-9]/gi, '-')}-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Error exporting workspace:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
