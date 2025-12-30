import { NextResponse } from 'next/server'
import { lucia, hashPassword } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, workspaces, pages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { ulid } from 'ulid'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const userId = ulid()
    const passwordHash = await hashPassword(password)

    // Create user
    await db.insert(users).values({
      id: userId,
      email: email.toLowerCase(),
      name: name || null,
      passwordHash,
    })

    // Create default workspace
    const workspaceId = ulid()
    await db.insert(workspaces).values({
      id: workspaceId,
      name: 'My Workspace',
      slug: `workspace-${workspaceId.toLowerCase().slice(0, 8)}`,
      icon: '📓',
    })

    // Create Showcase parent page
    const showcaseId = ulid()
    await db.insert(pages).values({
      id: showcaseId,
      workspaceId,
      title: 'Showcase',
      icon: '🎯',
      cover: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      content: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Explore the features of Scrivenry through these demo pages.' }] },
          { type: 'callout', attrs: { emoji: '👇' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click on any page in the sidebar to explore its features.' }] }] }
        ]
      },
      createdBy: userId,
      lastEditedBy: userId,
      depth: 0,
      position: 0,
    })

    // Create Getting Started page under Showcase
    const gettingStartedId = ulid()
    await db.insert(pages).values({
      id: gettingStartedId,
      workspaceId,
      parentId: showcaseId,
      title: 'Getting Started',
      icon: '👋',
      cover: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      content: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Welcome to Scrivenry! ' }, { type: 'text', marks: [{ type: 'bold' }], text: 'Knowledge. Free. Always.' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Quick Tips' }] },
          { type: 'callout', attrs: { emoji: '💡' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Type / anywhere in the editor to see all available block types.' }] }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key Features' }] },
          { type: 'taskList', content: [
            { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Block-based editing with slash commands' }] }] },
            { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Full-text search with Cmd+K' }] }] },
            { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Charts, diagrams, and code execution' }] }] },
            { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'AI-powered writing assistance' }] }] },
            { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'REST API for automation' }] }] }
          ]},
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Keyboard Shortcuts' }] },
          { type: 'table', content: [
            { type: 'tableRow', content: [
              { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Shortcut' }] }] },
              { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Action' }] }] }
            ]},
            { type: 'tableRow', content: [
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'Cmd+K' }] }] },
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quick Search' }] }] }
            ]},
            { type: 'tableRow', content: [
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: '/' }] }] },
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Slash Commands' }] }] }
            ]},
            { type: 'tableRow', content: [
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'Cmd+J' }] }] },
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'AI Assistant' }] }] }
            ]}
          ]}
        ]
      },
      createdBy: userId,
      lastEditedBy: userId,
      depth: 1,
      position: 0,
    })

    // Create Editor Blocks page under Showcase
    const editorBlocksId = ulid()
    await db.insert(pages).values({
      id: editorBlocksId,
      workspaceId,
      parentId: showcaseId,
      title: 'Editor Blocks',
      icon: '📝',
      content: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Scrivenry supports many block types. Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '/' }, { type: 'text', text: ' to insert any of these.' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Text Formatting' }] },
          { type: 'paragraph', content: [
            { type: 'text', text: 'You can format text as ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'bold' },
            { type: 'text', text: ', ' },
            { type: 'text', marks: [{ type: 'italic' }], text: 'italic' },
            { type: 'text', text: ', ' },
            { type: 'text', marks: [{ type: 'underline' }], text: 'underlined' },
            { type: 'text', text: ', or ' },
            { type: 'text', marks: [{ type: 'code' }], text: 'inline code' },
            { type: 'text', text: '.' }
          ]},
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Lists' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bullet list item' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Another item' }] }] }
          ]},
          { type: 'orderedList', attrs: { start: 1 }, content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Numbered item' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Second numbered item' }] }] }
          ]},
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Code Block' }] },
          { type: 'codeBlock', attrs: { language: 'javascript' }, content: [{ type: 'text', text: 'function hello() {\n  console.log("Hello, Scrivenry!");\n}' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Quote' }] },
          { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'The best way to predict the future is to create it.' }] }] }
        ]
      },
      createdBy: userId,
      lastEditedBy: userId,
      depth: 1,
      position: 1,
    })

    // Create Charts & Diagrams page
    const chartsId = ulid()
    await db.insert(pages).values({
      id: chartsId,
      workspaceId,
      parentId: showcaseId,
      title: 'Charts & Diagrams',
      icon: '📊',
      content: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Scrivenry supports rich visualizations including Mermaid diagrams and Chart.js charts.' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Mermaid Diagram' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Create flowcharts, sequence diagrams, and more using Mermaid syntax. Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '/mermaid' }, { type: 'text', text: ' to insert a diagram.' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Chart Block' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Create bar, line, pie, and doughnut charts. Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '/chart' }, { type: 'text', text: ' to insert a chart.' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Tables' }] },
          { type: 'table', content: [
            { type: 'tableRow', content: [
              { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Feature' }] }] },
              { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Status' }] }] }
            ]},
            { type: 'tableRow', content: [
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Mermaid Diagrams' }] }] },
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Supported' }] }] }
            ]},
            { type: 'tableRow', content: [
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Chart.js Charts' }] }] },
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Supported' }] }] }
            ]}
          ]}
        ]
      },
      createdBy: userId,
      lastEditedBy: userId,
      depth: 1,
      position: 2,
    })

    // Create API Examples page
    const apiId = ulid()
    await db.insert(pages).values({
      id: apiId,
      workspaceId,
      parentId: showcaseId,
      title: 'API Examples',
      icon: '🔌',
      content: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Scrivenry provides a REST API for automation and integration.' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Authentication' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Generate an API key in Settings > API Keys. Include it in requests:' }] },
          { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'curl -H "Authorization: Bearer YOUR_API_KEY" \\\n  http://localhost:3847/api/v1/pages' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Endpoints' }] },
          { type: 'table', content: [
            { type: 'tableRow', content: [
              { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Method' }] }] },
              { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Endpoint' }] }] },
              { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Description' }] }] }
            ]},
            { type: 'tableRow', content: [
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'GET' }] }] },
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '/api/v1/pages' }] }] },
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'List all pages' }] }] }
            ]},
            { type: 'tableRow', content: [
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'POST' }] }] },
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '/api/v1/pages' }] }] },
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Create a page' }] }] }
            ]},
            { type: 'tableRow', content: [
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'GET' }] }] },
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '/api/v1/search?q=' }] }] },
              { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Search pages' }] }] }
            ]}
          ]}
        ]
      },
      createdBy: userId,
      lastEditedBy: userId,
      depth: 1,
      position: 3,
    })

    // Create session
    const session = await lucia.createSession(userId, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    ;(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}
