'use client'

import { useState } from 'react'
import { Book, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Endpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  description: string
  auth: boolean
  requestBody?: string
  responseBody: string
  example?: {
    curl: string
    response: string
  }
}

const endpoints: { category: string; items: Endpoint[] }[] = [
  {
    category: 'Pages',
    items: [
      {
        method: 'GET',
        path: '/api/v1/pages',
        description: 'List all pages in the workspace',
        auth: true,
        responseBody: `{
  "pages": [
    {
      "id": "01ABC123...",
      "title": "My Page",
      "icon": "📄",
      "parentId": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}`,
        example: {
          curl: `curl -X GET "http://localhost:3847/api/v1/pages" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
          response: `{
  "pages": [
    {
      "id": "01KDGZCSHCPVSXXH41V6FS3Y84",
      "title": "Getting Started",
      "icon": "🚀",
      "parentId": null,
      "createdAt": "2024-12-28T10:00:00Z"
    }
  ]
}`
        }
      },
      {
        method: 'POST',
        path: '/api/v1/pages',
        description: 'Create a new page',
        auth: true,
        requestBody: `{
  "title": "New Page",
  "icon": "📝",
  "parentId": null,
  "content": {
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Hello world" }] }
    ]
  }
}`,
        responseBody: `{
  "id": "01ABC123...",
  "title": "New Page",
  "icon": "📝",
  "parentId": null,
  "content": {...},
  "createdAt": "2024-01-01T00:00:00Z"
}`,
        example: {
          curl: `curl -X POST "http://localhost:3847/api/v1/pages" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "My New Page", "icon": "📝"}'`,
          response: `{
  "id": "01NEWPAGE123",
  "title": "My New Page",
  "icon": "📝"
}`
        }
      },
      {
        method: 'GET',
        path: '/api/v1/pages/:id',
        description: 'Get a specific page by ID',
        auth: true,
        responseBody: `{
  "id": "01ABC123...",
  "title": "My Page",
  "icon": "📄",
  "content": {
    "type": "doc",
    "content": [...]
  },
  "parentId": null,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}`,
        example: {
          curl: `curl -X GET "http://localhost:3847/api/v1/pages/01KDGZCSHCPVSXXH41V6FS3Y84" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
          response: `{
  "id": "01KDGZCSHCPVSXXH41V6FS3Y84",
  "title": "Getting Started",
  "content": {"type": "doc", "content": [...]}
}`
        }
      },
      {
        method: 'PATCH',
        path: '/api/v1/pages/:id',
        description: 'Update a page',
        auth: true,
        requestBody: `{
  "title": "Updated Title",
  "icon": "🎉",
  "content": {...}
}`,
        responseBody: `{
  "id": "01ABC123...",
  "title": "Updated Title",
  "icon": "🎉",
  "updatedAt": "2024-01-01T00:00:00Z"
}`,
        example: {
          curl: `curl -X PATCH "http://localhost:3847/api/v1/pages/01KDGZCSHCPVSXXH41V6FS3Y84" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "New Title"}'`,
          response: `{
  "id": "01KDGZCSHCPVSXXH41V6FS3Y84",
  "title": "New Title"
}`
        }
      },
      {
        method: 'DELETE',
        path: '/api/v1/pages/:id',
        description: 'Delete a page (moves to trash)',
        auth: true,
        responseBody: `{ "success": true }`,
        example: {
          curl: `curl -X DELETE "http://localhost:3847/api/v1/pages/01KDGZCSHCPVSXXH41V6FS3Y84" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
          response: `{ "success": true }`
        }
      },
    ],
  },
  {
    category: 'Search',
    items: [
      {
        method: 'GET',
        path: '/api/v1/search?q=query',
        description: 'Search pages by title and content',
        auth: true,
        responseBody: `{
  "results": [
    {
      "id": "01ABC123...",
      "title": "Matching Page",
      "snippet": "...matched text...",
      "score": 0.95
    }
  ]
}`,
        example: {
          curl: `curl -X GET "http://localhost:3847/api/v1/search?q=getting%20started" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
          response: `{
  "results": [
    {
      "id": "01KDGZCSHCPVSXXH41V6FS3Y84",
      "title": "Getting Started",
      "snippet": "Welcome to Scrivenry...",
      "score": 0.98
    }
  ]
}`
        }
      },
    ],
  },
  {
    category: 'Workspace',
    items: [
      {
        method: 'GET',
        path: '/api/workspace/export',
        description: 'Export entire workspace as JSON',
        auth: true,
        responseBody: `{
  "workspace": {
    "id": "...",
    "name": "My Workspace"
  },
  "pages": [...],
  "exportedAt": "2024-01-01T00:00:00Z"
}`,
        example: {
          curl: `curl -X GET "http://localhost:3847/api/workspace/export" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -o workspace-backup.json`,
          response: `{
  "workspace": {"id": "...", "name": "My Workspace"},
  "pages": [...],
  "exportedAt": "2024-12-28T12:00:00Z"
}`
        }
      },
      {
        method: 'PATCH',
        path: '/api/workspace',
        description: 'Update workspace settings (rename)',
        auth: true,
        requestBody: `{ "name": "New Workspace Name" }`,
        responseBody: `{
  "id": "...",
  "name": "New Workspace Name",
  "updatedAt": "2024-01-01T00:00:00Z"
}`,
        example: {
          curl: `curl -X PATCH "http://localhost:3847/api/workspace" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "My Renamed Workspace"}'`,
          response: `{
  "id": "01WORKSPACE123",
  "name": "My Renamed Workspace"
}`
        }
      },
    ],
  },
  {
    category: 'Notifications',
    items: [
      {
        method: 'GET',
        path: '/api/v1/notifications',
        description: 'List notifications. Filter by status with ?status=unread|read|archived|active',
        auth: true,
        responseBody: `{
  "notifications": [
    {
      "id": "01ABC123...",
      "type": "page_created",
      "title": "New page created",
      "message": "\"My Page\" was created",
      "image_url": null,
      "video_url": null,
      "link_url": "/page/01XYZ...",
      "link_text": "View page",
      "page_id": "01XYZ...",
      "status": "unread",
      "snoozed_until": null,
      "created_at": "2024-01-01T00:00:00Z",
      "read_at": null,
      "archived_at": null
    }
  ],
  "unread_count": 5
}`,
        example: {
          curl: `curl -X GET "http://localhost:3847/api/v1/notifications?status=unread" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
          response: `{
  "notifications": [
    {
      "id": "01NOTIF123",
      "type": "page_created",
      "title": "New page created",
      "status": "unread",
      "created_at": "2024-12-28T10:00:00Z"
    }
  ],
  "unread_count": 1
}`
        }
      },
      {
        method: 'POST',
        path: '/api/v1/notifications',
        description: 'Create a notification with optional rich content (images, video, links)',
        auth: true,
        requestBody: `{
  "title": "New Feature Released",
  "message": "Check out our new notification system!",
  "type": "custom",
  "image_url": "https://example.com/image.jpg",
  "video_url": "https://example.com/video.mp4",
  "link_url": "/page/abc123",
  "link_text": "View Details",
  "page_id": "01ABC123...",
  "metadata": { "custom_field": "value" }
}`,
        responseBody: `{
  "id": "01NOTIF123...",
  "title": "New Feature Released",
  "message": "Check out our new notification system!",
  "type": "custom",
  "status": "unread",
  "created_at": "2024-01-01T00:00:00Z"
}`,
        example: {
          curl: `curl -X POST "http://localhost:3847/api/v1/notifications" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Reminder",
    "message": "Review the Q4 report",
    "link_url": "/page/01REPORT123",
    "link_text": "Open Report"
  }'`,
          response: `{
  "id": "01NOTIF456",
  "title": "Reminder",
  "status": "unread"
}`
        }
      },
      {
        method: 'GET',
        path: '/api/v1/notifications/:id',
        description: 'Get a specific notification by ID',
        auth: true,
        responseBody: `{
  "id": "01NOTIF123...",
  "type": "custom",
  "title": "Reminder",
  "message": "Review the Q4 report",
  "image_url": null,
  "video_url": null,
  "link_url": "/page/01REPORT123",
  "link_text": "Open Report",
  "page_id": null,
  "status": "unread",
  "snoozed_until": null,
  "created_at": "2024-01-01T00:00:00Z",
  "read_at": null,
  "archived_at": null
}`,
        example: {
          curl: `curl -X GET "http://localhost:3847/api/v1/notifications/01NOTIF123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
          response: `{
  "id": "01NOTIF123",
  "title": "Reminder",
  "status": "unread"
}`
        }
      },
      {
        method: 'PATCH',
        path: '/api/v1/notifications/:id',
        description: 'Update notification status. Actions: read, snooze, accept, archive, unarchive',
        auth: true,
        requestBody: `{
  "action": "snooze",
  "snoozed_until": "2024-01-15T09:00:00Z"
}

// Or simply:
{ "action": "read" }
{ "action": "accept" }
{ "action": "archive" }
{ "action": "unarchive" }`,
        responseBody: `{
  "id": "01NOTIF123...",
  "status": "snoozed",
  "snoozed_until": "2024-01-15T09:00:00Z"
}`,
        example: {
          curl: `curl -X PATCH "http://localhost:3847/api/v1/notifications/01NOTIF123" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"action": "archive"}'`,
          response: `{
  "id": "01NOTIF123",
  "status": "archived",
  "archived_at": "2024-12-28T12:00:00Z"
}`
        }
      },
      {
        method: 'DELETE',
        path: '/api/v1/notifications/:id',
        description: 'Permanently delete a notification',
        auth: true,
        responseBody: `{ "success": true }`,
        example: {
          curl: `curl -X DELETE "http://localhost:3847/api/v1/notifications/01NOTIF123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
          response: `{ "success": true }`
        }
      },
    ],
  },
]

const methodColors: Record<string, string> = {
  GET: 'bg-green-500/20 text-green-400',
  POST: 'bg-blue-500/20 text-blue-400',
  PATCH: 'bg-yellow-500/20 text-yellow-400',
  DELETE: 'bg-red-500/20 text-red-400',
}

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <pre className="bg-muted/50 rounded-lg p-4 text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-2 rounded bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <span className={cn('px-2 py-1 rounded text-xs font-mono font-bold', methodColors[endpoint.method])}>
          {endpoint.method}
        </span>
        <code className="text-sm font-mono flex-1">{endpoint.path}</code>
        {endpoint.auth && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Auth Required</span>
        )}
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="p-4 border-t space-y-4">
          <p className="text-sm text-muted-foreground">{endpoint.description}</p>

          {endpoint.requestBody && (
            <div>
              <h4 className="text-sm font-medium mb-2">Request Body</h4>
              <CodeBlock code={endpoint.requestBody} language="json" />
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-2">Response</h4>
            <CodeBlock code={endpoint.responseBody} language="json" />
          </div>

          {endpoint.example && (
            <div>
              <h4 className="text-sm font-medium mb-2">Example</h4>
              <div className="space-y-2">
                <CodeBlock code={endpoint.example.curl} language="bash" />
                <CodeBlock code={endpoint.example.response} language="json" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function APIDocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="flex items-center gap-3 mb-2">
        <Book className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">API Documentation</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Programmatic access to your Scrivenry workspace
      </p>

      {/* Authentication */}
      <div className="mb-8 p-6 rounded-lg border bg-card">
        <h2 className="text-lg font-medium mb-3">Authentication</h2>
        <p className="text-sm text-muted-foreground mb-4">
          All API requests require an API key. Create one in{' '}
          <a href="/settings/api-keys" className="text-primary hover:underline">
            Settings &gt; API Keys
          </a>
          . Include it in the Authorization header:
        </p>
        <CodeBlock code={`Authorization: Bearer YOUR_API_KEY`} />
      </div>

      {/* Base URL */}
      <div className="mb-8 p-6 rounded-lg border bg-card">
        <h2 className="text-lg font-medium mb-3">Base URL</h2>
        <CodeBlock code={`http://localhost:3847`} />
      </div>

      {/* Endpoints */}
      {endpoints.map((category) => (
        <div key={category.category} className="mb-8">
          <h2 className="text-xl font-medium mb-4">{category.category}</h2>
          <div className="space-y-3">
            {category.items.map((endpoint) => (
              <EndpointCard key={`${endpoint.method}-${endpoint.path}`} endpoint={endpoint} />
            ))}
          </div>
        </div>
      ))}

      {/* Rate Limits */}
      <div className="p-6 rounded-lg border bg-card">
        <h2 className="text-lg font-medium mb-3">Rate Limits</h2>
        <p className="text-sm text-muted-foreground">
          API requests are limited to 1000 requests per minute per API key.
          Rate limit headers are included in all responses:
        </p>
        <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
          <li><code>X-RateLimit-Limit</code>: Maximum requests allowed</li>
          <li><code>X-RateLimit-Remaining</code>: Requests remaining</li>
          <li><code>X-RateLimit-Reset</code>: Time when the limit resets</li>
        </ul>
      </div>
    </div>
  )
}
