import Database from 'better-sqlite3'
import { ulid } from 'ulid'

const db = new Database('./data/scrivenry.db')

// Get the workspace and user (create if needed)
let workspace = db.prepare('SELECT * FROM workspaces LIMIT 1').get() as any
let user = db.prepare('SELECT * FROM users LIMIT 1').get() as any

if (!workspace) {
  const workspaceId = ulid()
  db.prepare(`
    INSERT INTO workspaces (id, name, slug, created_at, updated_at)
    VALUES (?, 'Personal KB', 'personal', ?, ?)
  `).run(workspaceId, Date.now(), Date.now())
  workspace = { id: workspaceId }
}

if (!user) {
  console.log('No user found. Please register first.')
  process.exit(1)
}

const WORKSPACE_ID = workspace.id
const USER_ID = user.id
const now = Date.now()

// Clear existing pages
db.prepare('DELETE FROM pages WHERE workspace_id = ?').run(WORKSPACE_ID)
console.log('Cleared existing pages.')

const showcasePages = [
  {
    title: 'Welcome to Scrivenry',
    icon: '👋',
    cover: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Welcome to Scrivenry' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Scrivenry is a powerful, self-hosted documentation platform with a block-based editor similar to Notion. Knowledge. Free. Always.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Getting Started' }] },
        { type: 'callout', attrs: { emoji: '💡' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Type / anywhere in the editor to see all available block types.' }] }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Key Features' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Block-based editing with slash commands' }] }] },
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Tags and favorites for organization' }] }] },
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Full-text search with Cmd+K' }] }] },
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Charts, diagrams, and code execution' }] }] },
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'REST API for automation' }] }] },
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Export to Markdown and HTML' }] }] }
        ]},
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Keyboard Shortcuts' }] },
        { type: 'table', content: [
          { type: 'tableRow', content: [
            { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Shortcut' }] }] },
            { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Action' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'Cmd+K' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quick search' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'Cmd+/' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Keyboard shortcuts' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'Cmd+.' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Zen mode' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: '/' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Slash commands menu' }] }] }
          ]}
        ]},
        { type: 'horizontalRule' },
        { type: 'paragraph', content: [{ type: 'text', text: 'Explore the showcase pages in the sidebar to learn about all the features!' }] }
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
        { type: 'paragraph', content: [{ type: 'text', text: 'Scrivenry supports a wide variety of block types. Type / to insert any of these.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Text Formatting' }] },
        { type: 'paragraph', content: [
          { type: 'text', marks: [{ type: 'bold' }], text: 'Bold' },
          { type: 'text', text: ', ' },
          { type: 'text', marks: [{ type: 'italic' }], text: 'italic' },
          { type: 'text', text: ', ' },
          { type: 'text', marks: [{ type: 'underline' }], text: 'underline' },
          { type: 'text', text: ', ' },
          { type: 'text', marks: [{ type: 'strike' }], text: 'strikethrough' },
          { type: 'text', text: ', and ' },
          { type: 'text', marks: [{ type: 'code' }], text: 'inline code' }
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
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Completed task' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Pending task' }] }] }
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Callout' }] },
        { type: 'callout', attrs: { emoji: '💡' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Callouts are great for tips, warnings, and important notes.' }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Quote' }] },
        { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'The only way to do great work is to love what you do. - Steve Jobs' }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Code Block' }] },
        { type: 'codeBlock', attrs: { language: 'javascript' }, content: [{ type: 'text', text: 'function hello() {\n  console.log("Hello, Scrivenry!");\n}' }]}
      ]
    }
  },
  {
    title: 'Charts & Diagrams',
    icon: '📊',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Charts & Diagrams' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Create visual content with charts and diagrams.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Mermaid Diagrams' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Create flowcharts, sequence diagrams, and more:' }] },
        { type: 'mermaidBlock', attrs: { code: 'flowchart LR\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Do Something]\n    B -->|No| D[Do Other]\n    C --> E[End]\n    D --> E' }},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Chart Block' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Create bar, line, and pie charts:' }] },
        { type: 'chartBlock', attrs: { chartType: 'bar', config: JSON.stringify({
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [{
            label: 'Revenue',
            data: [12000, 19000, 15000, 22000],
            backgroundColor: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']
          }]
        }) }}
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
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'curl -H "Authorization: Bearer nf_sk_your_api_key" \\\n  http://localhost:3847/api/v1/pages' }]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'List Pages' }] },
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'GET /api/v1/pages\n\n# Response:\n{\n  "pages": [\n    {\n      "id": "01HXYZ...",\n      "title": "My Page",\n      "icon": "📄",\n      "createdAt": "2024-01-01T00:00:00.000Z"\n    }\n  ]\n}' }]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Create Page' }] },
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'POST /api/v1/pages\nContent-Type: application/json\n\n{\n  "title": "New Page",\n  "icon": "📝",\n  "content": {\n    "type": "doc",\n    "content": [\n      {\n        "type": "paragraph",\n        "content": [{"type": "text", "text": "Hello!"}]\n      }\n    ]\n  }\n}' }]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Get Page' }] },
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'GET /api/v1/pages/:id\n\n# Response includes full page content' }]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Update Page' }] },
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'PATCH /api/v1/pages/:id\nContent-Type: application/json\n\n{\n  "title": "Updated Title",\n  "icon": "✨"\n}' }]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Delete Page' }] },
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'DELETE /api/v1/pages/:id\n\n# Moves to trash by default\n# Add ?permanent=true to permanently delete' }]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Search' }] },
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'GET /api/v1/search?q=your+search+term\n\n# Response:\n{\n  "results": [\n    {"id": "...", "title": "...", "snippet": "..."}\n  ]\n}' }]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'JavaScript Example' }] },
        { type: 'codeBlock', attrs: { language: 'javascript' }, content: [{ type: 'text', text: 'const API_KEY = "nf_sk_your_api_key";\nconst BASE_URL = "http://localhost:3847/api/v1";\n\nasync function listPages() {\n  const response = await fetch(`${BASE_URL}/pages`, {\n    headers: {\n      "Authorization": `Bearer ${API_KEY}`\n    }\n  });\n  return response.json();\n}\n\nasync function createPage(title, content) {\n  const response = await fetch(`${BASE_URL}/pages`, {\n    method: "POST",\n    headers: {\n      "Authorization": `Bearer ${API_KEY}`,\n      "Content-Type": "application/json"\n    },\n    body: JSON.stringify({ title, content })\n  });\n  return response.json();\n}' }]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Python Example' }] },
        { type: 'codeBlock', attrs: { language: 'python' }, content: [{ type: 'text', text: 'import requests\n\nAPI_KEY = "nf_sk_your_api_key"\nBASE_URL = "http://localhost:3847/api/v1"\n\ndef list_pages():\n    response = requests.get(\n        f"{BASE_URL}/pages",\n        headers={"Authorization": f"Bearer {API_KEY}"}\n    )\n    return response.json()\n\ndef create_page(title, content):\n    response = requests.post(\n        f"{BASE_URL}/pages",\n        headers={\n            "Authorization": f"Bearer {API_KEY}",\n            "Content-Type": "application/json"\n        },\n        json={"title": title, "content": content}\n    )\n    return response.json()' }]}
      ]
    }
  }
]

// Insert pages
const insertPage = db.prepare(`
  INSERT INTO pages (id, workspace_id, title, icon, cover, content, created_by, last_edited_by, created_at, updated_at, depth, position)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
`)

showcasePages.forEach((page, index) => {
  const id = ulid()
  insertPage.run(
    id,
    WORKSPACE_ID,
    page.title,
    page.icon,
    page.cover || null,
    JSON.stringify(page.content),
    USER_ID,
    USER_ID,
    now,
    now,
    index
  )
  console.log(`Created: ${page.title}`)
})

// Set tour flag to show tour for new users
db.prepare(`
  UPDATE users SET settings = json_set(COALESCE(settings, '{}'), '$.showTour', true)
  WHERE id = ?
`).run(USER_ID)

db.close()
console.log('\nShowcase pages created successfully!')
console.log('Restart the app and the welcome tour will begin.')
