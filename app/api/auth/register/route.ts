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

    // Create Charts & Diagrams page with working examples
    const chartsId = ulid()
    await db.insert(pages).values({
      id: chartsId,
      workspaceId,
      parentId: showcaseId,
      title: 'Charts & Diagrams',
      icon: '📊',
      cover: 'animated:aurora',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Charts & Diagrams' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Create beautiful visualizations directly in your documents.' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Flowchart (Mermaid)' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Document workflows and processes with Mermaid diagrams:' }] },
          { type: 'mermaidBlock', attrs: { code: 'flowchart TD\n    A[New Feature Request] --> B{Is it feasible?}\n    B -->|Yes| C[Design Phase]\n    B -->|No| D[Reject & Document]\n    C --> E[Implementation]\n    E --> F[Code Review]\n    F --> G{Approved?}\n    G -->|Yes| H[Deploy]\n    G -->|No| E\n    H --> I[Monitor]\n    D --> J[Archive]' }},
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Sequence Diagram' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Visualize API interactions and system flows:' }] },
          { type: 'mermaidBlock', attrs: { code: 'sequenceDiagram\n    participant User\n    participant Browser\n    participant Server\n    participant Database\n    \n    User->>Browser: Click Save\n    Browser->>Server: POST /api/pages\n    Server->>Database: INSERT page\n    Database-->>Server: Success\n    Server-->>Browser: 200 OK\n    Browser-->>User: Show success' }},
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Bar Chart' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Track metrics with interactive charts:' }] },
          { type: 'chartBlock', attrs: {
            chartType: 'bar',
            config: JSON.stringify({
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [{
                label: 'Monthly Revenue ($K)',
                data: [45, 52, 48, 61, 55, 72],
                backgroundColor: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#8b5cf6', '#a78bfa', '#c4b5fd']
              }]
            })
          }},
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Pie Chart' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Show distributions and proportions:' }] },
          { type: 'chartBlock', attrs: {
            chartType: 'pie',
            config: JSON.stringify({
              labels: ['Development', 'Design', 'Marketing', 'Operations', 'Support'],
              datasets: [{
                data: [35, 20, 25, 12, 8],
                backgroundColor: ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444']
              }]
            })
          }},
          { type: 'callout', attrs: { emoji: '💡' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '/mermaid' }, { type: 'text', text: ' for diagrams or ' }, { type: 'text', marks: [{ type: 'code' }], text: '/chart' }, { type: 'text', text: ' for charts. Click any chart to edit its data!' }] }] }
        ]
      },
      createdBy: userId,
      lastEditedBy: userId,
      depth: 1,
      position: 2,
    })

    // Create Code Execution page - prominently showing JS/Python
    const codeExecId = ulid()
    await db.insert(pages).values({
      id: codeExecId,
      workspaceId,
      parentId: showcaseId,
      title: 'Code Execution',
      icon: '💻',
      cover: 'animated:matrix',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Live Code Execution' }] },
          { type: 'callout', attrs: { emoji: '🚀' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Run JavaScript and Python code directly in your browser! Click the green Run button to execute.' }] }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'JavaScript Example' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Calculate Fibonacci sequence and display results:' }] },
          { type: 'javascriptBlock', attrs: {
            code: '// Fibonacci sequence generator\nfunction fibonacci(n) {\n  const seq = [0, 1];\n  for (let i = 2; i < n; i++) {\n    seq.push(seq[i-1] + seq[i-2]);\n  }\n  return seq;\n}\n\nconst result = fibonacci(10);\nconsole.log("First 10 Fibonacci numbers:");\nconsole.log(result.join(", "));\n\n// Calculate sum\nconst sum = result.reduce((a, b) => a + b, 0);\nconsole.log("Sum:", sum);',
            output: null,
            error: null,
            autoRun: false,
            showOutput: true
          }},
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Python Example' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Data analysis with Python (powered by Pyodide):' }] },
          { type: 'pythonBlock', attrs: {
            code: '# Python runs in your browser via Pyodide!\nimport math\n\n# Prime number checker\ndef is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(math.sqrt(n)) + 1):\n        if n % i == 0:\n            return False\n    return True\n\n# Find primes up to 50\nprimes = [n for n in range(2, 51) if is_prime(n)]\nprint(f"Prime numbers up to 50:")\nprint(primes)\nprint(f"\\nTotal: {len(primes)} primes")',
            output: null,
            error: null,
            showOutput: true
          }},
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Interactive Math' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Try modifying the code and running it yourself:' }] },
          { type: 'javascriptBlock', attrs: {
            code: '// Interactive example - try changing these values!\nconst width = 5;\nconst height = 3;\n\n// Draw a rectangle with asterisks\nfor (let row = 0; row < height; row++) {\n  let line = "";\n  for (let col = 0; col < width; col++) {\n    if (row === 0 || row === height-1 || col === 0 || col === width-1) {\n      line += "* ";\n    } else {\n      line += "  ";\n    }\n  }\n  console.log(line);\n}\n\nconsole.log(`\\nArea: ${width * height} square units`);',
            output: null,
            error: null,
            autoRun: false,
            showOutput: true
          }},
          { type: 'callout', attrs: { emoji: '💡' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '/javascript' }, { type: 'text', text: ' or ' }, { type: 'text', marks: [{ type: 'code' }], text: '/python' }, { type: 'text', text: ' anywhere to add your own code blocks!' }] }] }
        ]
      },
      createdBy: userId,
      lastEditedBy: userId,
      depth: 1,
      position: 3,
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
      position: 4,
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
