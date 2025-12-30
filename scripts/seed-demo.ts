import Database from 'better-sqlite3'
import { ulid } from 'ulid'
import * as crypto from 'crypto'

const db = new Database('./data/scrivenry.db')

// Create demo user with password "demo123"
const userId = ulid()
const salt = crypto.randomBytes(16)
const hash = crypto.pbkdf2Sync('demo123', salt, 100000, 64, 'sha256')
const passwordHash = `${salt.toString('hex')}:${hash.toString('hex')}`

db.prepare(`
  INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
  VALUES (?, 'demo@scrivenry.local', 'Demo User', ?, strftime('%s','now') * 1000, strftime('%s','now') * 1000)
`).run(userId, passwordHash)

console.log('Created demo user: demo@scrivenry.local / demo123')

// Create workspace
const workspaceId = ulid()
db.prepare(`
  INSERT INTO workspaces (id, name, slug, icon, created_at, updated_at)
  VALUES (?, 'My Workspace', 'my-workspace', '📚', strftime('%s','now') * 1000, strftime('%s','now') * 1000)
`).run(workspaceId)

console.log('Created workspace')

// Create Showcase parent page
const showcaseId = ulid()
db.prepare(`
  INSERT INTO pages (id, workspace_id, title, icon, cover, content, created_by, last_edited_by, created_at, updated_at, depth, position)
  VALUES (?, ?, 'Showcase', '🎯', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', ?, ?, ?, strftime('%s','now') * 1000, strftime('%s','now') * 1000, 0, 0)
`).run(showcaseId, workspaceId, JSON.stringify({
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Showcase' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Explore the features of Scrivenry through these demo pages. Each page demonstrates different capabilities of the editor.' }] },
    { type: 'callout', attrs: { emoji: '👇' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click on any page in the sidebar to explore its features.' }] }] }
  ]
}), userId, userId)

console.log('Created: Showcase (parent)')

// Comprehensive showcase child pages
const showcasePages = [
  {
    title: 'Welcome to Scrivenry',
    icon: '👋',
    cover: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Welcome to Scrivenry' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Scrivenry is a powerful, self-hosted documentation platform with a block-based editor. ' }, { type: 'text', marks: [{ type: 'bold' }], text: 'Knowledge. Free. Always.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Getting Started' }] },
        { type: 'callout', attrs: { emoji: '💡' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Type / anywhere in the editor to see all available block types.' }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key Features' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Block-based editing with slash commands' }] }] },
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Tags and favorites for organization' }] }] },
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Full-text search with Cmd+K' }] }] },
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Charts, diagrams, and code execution' }] }] },
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'REST API for automation' }] }] },
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Export to Markdown and HTML' }] }] },
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'AI-powered writing assistance' }] }] }
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Keyboard Shortcuts' }] },
        { type: 'table', content: [
          { type: 'tableRow', content: [
            { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Shortcut' }] }] },
            { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Action' }] }] },
            { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Description' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'Cmd+K' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quick Search' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Search all pages instantly' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'Cmd+N' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'New Page' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Create a new page' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'Cmd+.' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Zen Mode' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Distraction-free writing' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: '/' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Slash Commands' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Insert any block type' }] }] }
          ]}
        ]},
        { type: 'horizontalRule' },
        { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'The best way to predict the future is to create it. — Peter Drucker' }] }] }
      ]
    }
  },
  {
    title: 'Editor Blocks',
    icon: '📝',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Editor Blocks' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Scrivenry supports a wide variety of block types. Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '/' }, { type: 'text', text: ' to insert any of these.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Text Formatting' }] },
        { type: 'paragraph', content: [
          { type: 'text', text: 'You can format text as ' },
          { type: 'text', marks: [{ type: 'bold' }], text: 'bold' },
          { type: 'text', text: ', ' },
          { type: 'text', marks: [{ type: 'italic' }], text: 'italic' },
          { type: 'text', text: ', ' },
          { type: 'text', marks: [{ type: 'underline' }], text: 'underlined' },
          { type: 'text', text: ', ' },
          { type: 'text', marks: [{ type: 'strike' }], text: 'strikethrough' },
          { type: 'text', text: ', or ' },
          { type: 'text', marks: [{ type: 'code' }], text: 'inline code' },
          { type: 'text', text: '. You can also combine them: ' },
          { type: 'text', marks: [{ type: 'bold' }, { type: 'italic' }], text: 'bold italic' },
          { type: 'text', text: '.' }
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Headings' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'This is Heading 3' }] },
        { type: 'heading', attrs: { level: 4 }, content: [{ type: 'text', text: 'This is Heading 4' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Lists' }] },
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Bullet List:' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First item' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Second item with nested list' }] }, { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nested item A' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nested item B' }] }] }
          ]}] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Third item' }] }] }
        ]},
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Numbered List:' }] },
        { type: 'orderedList', attrs: { start: 1 }, content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step one' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step two' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step three' }] }] }
        ]},
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Task List:' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Completed task' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Pending task' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Another pending task' }] }] }
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Callouts' }] },
        { type: 'callout', attrs: { emoji: '💡' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'This is a tip callout. Great for helpful hints!' }] }] },
        { type: 'callout', attrs: { emoji: '⚠️' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'This is a warning callout. Use for important notices.' }] }] },
        { type: 'callout', attrs: { emoji: '📌' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'This is a note callout. Perfect for additional information.' }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Quotes' }] },
        { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'The only way to do great work is to love what you do. If you haven\'t found it yet, keep looking. Don\'t settle.' }] }, { type: 'paragraph', content: [{ type: 'text', text: '— Steve Jobs' }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Code Blocks' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'JavaScript:' }] },
        { type: 'codeBlock', attrs: { language: 'javascript' }, content: [{ type: 'text', text: 'function greet(name) {\n  console.log(`Hello, ${name}!`);\n  return `Welcome to Scrivenry`;\n}\n\ngreet(\'World\');' }]},
        { type: 'paragraph', content: [{ type: 'text', text: 'Python:' }] },
        { type: 'codeBlock', attrs: { language: 'python' }, content: [{ type: 'text', text: 'def fibonacci(n):\n    """Generate Fibonacci sequence up to n terms."""\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b\n\nprint(list(fibonacci(10)))' }]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Divider' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Use horizontal rules to separate sections:' }] },
        { type: 'horizontalRule' },
        { type: 'paragraph', content: [{ type: 'text', text: 'Content continues after the divider.' }] }
      ]
    }
  },
  {
    title: 'Charts & Diagrams',
    icon: '📊',
    cover: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Charts & Diagrams' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Create visual content with interactive charts and Mermaid diagrams.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Mermaid Diagrams' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Flowcharts, sequence diagrams, and more using Mermaid syntax:' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Flowchart' }] },
        { type: 'mermaidBlock', attrs: { code: 'flowchart TD\n    A[Start] --> B{Is it working?}\n    B -->|Yes| C[Great!]\n    B -->|No| D[Debug]\n    D --> E[Fix the bug]\n    E --> B\n    C --> F[Deploy]' }},
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Sequence Diagram' }] },
        { type: 'mermaidBlock', attrs: { code: 'sequenceDiagram\n    participant User\n    participant App\n    participant API\n    participant Database\n    User->>App: Click button\n    App->>API: Send request\n    API->>Database: Query data\n    Database-->>API: Return results\n    API-->>App: JSON response\n    App-->>User: Display data' }},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Charts' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Create bar, line, pie, and doughnut charts:' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Bar Chart - Quarterly Revenue' }] },
        { type: 'chartBlock', attrs: { chartType: 'bar', config: JSON.stringify({
          labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
          datasets: [{
            label: 'Revenue ($K)',
            data: [120, 190, 150, 220],
            backgroundColor: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']
          }]
        }) }},
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Pie Chart - Traffic Sources' }] },
        { type: 'chartBlock', attrs: { chartType: 'pie', config: JSON.stringify({
          labels: ['Organic Search', 'Direct', 'Social Media', 'Referral', 'Email'],
          datasets: [{
            data: [45, 25, 15, 10, 5],
            backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
          }]
        }) }},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Tables' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Create structured data with tables:' }] },
        { type: 'table', content: [
          { type: 'tableRow', content: [
            { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Feature' }] }] },
            { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Status' }] }] },
            { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Notes' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Mermaid Diagrams' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '✅ Complete' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Flowcharts, sequence, class diagrams' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Chart.js Charts' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '✅ Complete' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bar, line, pie, doughnut' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Interactive Editing' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '✅ Complete' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click to edit diagram code' }] }] }
          ]}
        ]}
      ]
    }
  },
  {
    title: 'API Examples',
    icon: '🔌',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'API Examples' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Scrivenry provides a REST API for programmatic access to your pages.' }] },
        { type: 'callout', attrs: { emoji: '🔑' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Generate an API key in Settings > API Keys to authenticate requests.' }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Authentication' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Include your API key in the Authorization header:' }] },
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'curl -H "Authorization: Bearer YOUR_API_KEY" \\\n  http://localhost:3847/api/v1/pages' }]},
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
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Create a new page' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'GET' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '/api/v1/pages/:id' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Get page by ID' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'PATCH' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '/api/v1/pages/:id' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Update page' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'DELETE' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '/api/v1/pages/:id' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Delete page' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'GET' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '/api/v1/search?q=...' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Search pages' }] }] }
          ]}
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'JavaScript Example' }] },
        { type: 'codeBlock', attrs: { language: 'javascript' }, content: [{ type: 'text', text: 'const API_KEY = "YOUR_API_KEY";\nconst BASE_URL = "http://localhost:3847/api/v1";\n\n// List all pages\nasync function listPages() {\n  const response = await fetch(`${BASE_URL}/pages`, {\n    headers: { "Authorization": `Bearer ${API_KEY}` }\n  });\n  return response.json();\n}\n\n// Create a new page\nasync function createPage(title, content) {\n  const response = await fetch(`${BASE_URL}/pages`, {\n    method: "POST",\n    headers: {\n      "Authorization": `Bearer ${API_KEY}`,\n      "Content-Type": "application/json"\n    },\n    body: JSON.stringify({\n      title,\n      icon: "📄",\n      content: {\n        type: "doc",\n        content: [{\n          type: "paragraph",\n          content: [{ type: "text", text: content }]\n        }]\n      }\n    })\n  });\n  return response.json();\n}\n\n// Usage\nconst pages = await listPages();\nconsole.log(pages);' }]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Python Example' }] },
        { type: 'codeBlock', attrs: { language: 'python' }, content: [{ type: 'text', text: 'import requests\n\nAPI_KEY = "YOUR_API_KEY"\nBASE_URL = "http://localhost:3847/api/v1"\n\ndef list_pages():\n    """Fetch all pages from the API."""\n    response = requests.get(\n        f"{BASE_URL}/pages",\n        headers={"Authorization": f"Bearer {API_KEY}"}\n    )\n    return response.json()\n\ndef create_page(title: str, content: str):\n    """Create a new page with the given title and content."""\n    response = requests.post(\n        f"{BASE_URL}/pages",\n        headers={\n            "Authorization": f"Bearer {API_KEY}",\n            "Content-Type": "application/json"\n        },\n        json={\n            "title": title,\n            "icon": "📄",\n            "content": {\n                "type": "doc",\n                "content": [{\n                    "type": "paragraph",\n                    "content": [{"type": "text", "text": content}]\n                }]\n            }\n        }\n    )\n    return response.json()\n\n# Usage\nif __name__ == "__main__":\n    pages = list_pages()\n    print(f"Found {len(pages[\'pages\'])} pages")' }]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Response Format' }] },
        { type: 'codeBlock', attrs: { language: 'json' }, content: [{ type: 'text', text: '{\n  "pages": [\n    {\n      "id": "01HXYZ...",\n      "title": "My Page",\n      "icon": "📄",\n      "parentId": null,\n      "createdAt": "2024-01-01T00:00:00.000Z",\n      "updatedAt": "2024-01-01T00:00:00.000Z"\n    }\n  ]\n}' }]}
      ]
    }
  },
  {
    title: 'Interactive Blocks',
    icon: '⚡',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Interactive Blocks' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Scrivenry includes various interactive blocks for rich, dynamic content.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Toggle Blocks' }] },
        { type: 'callout', attrs: { emoji: '📁' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Use toggle blocks to hide/show content. Great for FAQs and collapsible sections.' }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Progress Tracking' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Track progress with task lists:' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Research phase complete' }] }] },
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Design mockups approved' }] }] },
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Development started' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Testing in progress' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Deployment pending' }] }] }
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Code Execution' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Run JavaScript directly in your notes:' }] },
        { type: 'codeBlock', attrs: { language: 'javascript' }, content: [{ type: 'text', text: '// This code can be executed!\nconst numbers = [1, 2, 3, 4, 5];\nconst sum = numbers.reduce((a, b) => a + b, 0);\nconst average = sum / numbers.length;\n\nconsole.log(`Sum: ${sum}`);\nconsole.log(`Average: ${average}`);' }]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Embeds' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Embed external content:' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'YouTube videos' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Loom recordings' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Figma designs' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'CodePen demos' }] }] }
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Math Equations' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Write mathematical equations using LaTeX syntax:' }] },
        { type: 'codeBlock', attrs: { language: 'latex' }, content: [{ type: 'text', text: 'E = mc^2\n\n\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\n\n\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}' }]}
      ]
    }
  }
]

// Insert child pages under Showcase
showcasePages.forEach((page, index) => {
  const pageId = ulid()
  db.prepare(`
    INSERT INTO pages (id, workspace_id, parent_id, title, icon, cover, content, created_by, last_edited_by, created_at, updated_at, depth, position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s','now') * 1000, strftime('%s','now') * 1000, 1, ?)
  `).run(pageId, workspaceId, showcaseId, page.title, page.icon, page.cover || null, JSON.stringify(page.content), userId, userId, index)
  console.log('  Created:', page.title)
})

db.close()
console.log('\n✓ Demo setup complete!')
console.log('\nLogin: demo@scrivenry.local / demo123')
