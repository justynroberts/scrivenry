# Scrivenry REST API Documentation

Scrivenry provides two API layers:

1. **Internal API** (`/api/*`) — Session-based authentication via cookies, used by the web UI
2. **REST API v1** (`/api/v1/*`) — API key authentication via Bearer token, for external integrations

---

## Authentication

### Session-Based (Internal API)

Login via `POST /api/auth/login` to receive a session cookie. All subsequent requests are authenticated via the cookie.

### API Key (REST API v1)

Create an API key in Settings > API Keys. Include it in all requests:

```
Authorization: Bearer nf_sk_...
```

Key format: `nf_sk_` followed by 64 hex characters. Keys are hashed (SHA-256) before storage — the full key is only shown once at creation time.

---

## REST API v1 Endpoints

All v1 endpoints use `snake_case` in request/response bodies.

### Pages

#### List Pages

```
GET /api/v1/pages
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspace_id` | query | No | Filter by workspace |
| `parent_id` | query | No | Filter by parent page |
| `limit` | query | No | Max results (default: 50) |
| `cursor` | query | No | Pagination cursor |

**Response** `200`

```json
{
  "pages": [
    {
      "id": "01HXYZ...",
      "workspace_id": "01HABC...",
      "parent_id": null,
      "title": "Getting Started",
      "icon": "📖",
      "cover": null,
      "path": [],
      "depth": 0,
      "position": 0,
      "is_template": false,
      "properties": {},
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T12:30:00.000Z"
    }
  ],
  "has_more": false,
  "next_cursor": null
}
```

#### Create Page

```
POST /api/v1/pages
```

**Request Body**

```json
{
  "workspace_id": "01HABC...",
  "parent_id": null,
  "title": "My New Page",
  "icon": "📄",
  "properties": {},
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Hello world" }]
      }
    ]
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | string | Yes | Target workspace |
| `parent_id` | string | No | Parent page for nesting |
| `title` | string | No | Page title (default: "Untitled") |
| `icon` | string | No | Emoji icon |
| `properties` | object | No | Custom properties |
| `content` | object | No | TipTap JSON content |

**Response** `201`

```json
{
  "page": {
    "id": "01HNEW...",
    "workspace_id": "01HABC...",
    "title": "My New Page",
    "icon": "📄",
    "path": [],
    "depth": 0,
    "position": 5,
    "properties": {},
    "created_at": "2025-01-15T14:00:00.000Z",
    "updated_at": "2025-01-15T14:00:00.000Z"
  }
}
```

#### Get Page

```
GET /api/v1/pages/:id
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `include_blocks` | query | No | Set to `"true"` to include content |

**Response** `200` — Same shape as create response. Content included only when `include_blocks=true`.

#### Update Page

```
PATCH /api/v1/pages/:id
```

**Request Body** — All fields optional.

```json
{
  "title": "Updated Title",
  "icon": "🚀",
  "cover": "https://example.com/image.jpg",
  "content": { "type": "doc", "content": [] },
  "properties": { "status": "draft" },
  "parent_id": "01HPARENT..."
}
```

Setting `parent_id` moves the page. Circular references are rejected with `400`.

**Response** `200` — Updated page object.

#### Delete Page

```
DELETE /api/v1/pages/:id
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `permanent` | query | No | `"true"` for hard delete, otherwise soft delete (trash) |

**Response** `200`

```json
{ "success": true }
```

#### Move Page

```
POST /api/v1/pages/:id/move
```

**Request Body**

```json
{
  "parent_id": "01HPARENT..."
}
```

Set `parent_id` to `null` to move to root level. Circular references are rejected.

**Response** `200`

```json
{
  "page": {
    "id": "01HXYZ...",
    "workspace_id": "01HABC...",
    "parent_id": "01HPARENT...",
    "title": "Moved Page",
    "icon": "📄",
    "path": ["01HPARENT..."],
    "depth": 1,
    "updated_at": "2025-01-15T15:00:00.000Z"
  }
}
```

### Search

#### Search Pages

```
GET /api/v1/search
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | query | Yes | Search query |
| `workspace_id` | query | No | Filter by workspace |
| `limit` | query | No | Max results (default: 20, max: 100) |

**Response** `200`

```json
{
  "results": [
    {
      "type": "page",
      "id": "01HXYZ...",
      "title": "Getting Started",
      "icon": "📖",
      "path": [],
      "workspace_id": "01HABC...",
      "highlight": "Getting <mark>Started</mark>",
      "score": 0.85
    }
  ],
  "total": 1,
  "took_ms": 12
}
```

### Notifications

#### List Notifications

```
GET /api/v1/notifications
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | query | No | `unread`, `read`, `snoozed`, `accepted`, `archived`, `active`, `all` |
| `limit` | query | No | Max results (default: 50) |
| `cursor` | query | No | Pagination cursor |

**Response** `200`

```json
{
  "notifications": [
    {
      "id": "01HNOTIF...",
      "type": "custom",
      "title": "New document created",
      "message": "PRD: Authentication was created via API",
      "image_url": null,
      "video_url": null,
      "link_url": "http://oracle.local:9009/page/01HPAGE...",
      "link_text": "View page",
      "metadata": {},
      "page_id": "01HPAGE...",
      "status": "unread",
      "snoozed_until": null,
      "created_at": "2025-01-15T14:00:00.000Z",
      "read_at": null,
      "archived_at": null
    }
  ],
  "unread_count": 3,
  "has_more": false,
  "next_cursor": null
}
```

#### Create Notification

```
POST /api/v1/notifications
```

**Request Body**

```json
{
  "type": "custom",
  "title": "Deployment complete",
  "message": "v2.1.0 deployed to production",
  "link_url": "https://example.com/releases/v2.1.0",
  "link_text": "View release",
  "page_id": "01HPAGE...",
  "metadata": { "version": "2.1.0" }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Notification title |
| `type` | string | No | Type identifier (default: `custom`) |
| `message` | string | No | Body text |
| `image_url` | string | No | Image URL to display |
| `video_url` | string | No | Video URL to embed |
| `link_url` | string | No | Clickable link URL |
| `link_text` | string | No | Link display text |
| `page_id` | string | No | Related page ID for navigation |
| `metadata` | object | No | Arbitrary metadata |

**Response** `201` — Notification object.

#### Get Notification

```
GET /api/v1/notifications/:id
```

**Response** `200` — Single notification object.

#### Update Notification

```
PATCH /api/v1/notifications/:id
```

**Request Body**

```json
{
  "action": "read",
  "snoozed_until": "2025-01-16T09:00:00.000Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | Yes | `read`, `unread`, `snooze`, `accept`, `archive`, `unarchive` |
| `snoozed_until` | string | For snooze | ISO 8601 timestamp when snooze expires |

**Response** `200` — Updated notification object.

#### Delete Notification

```
DELETE /api/v1/notifications/:id
```

**Response** `200`

```json
{ "success": true }
```

---

## Internal API Endpoints

These endpoints use session-based authentication (cookies) and `camelCase` in request/response bodies.

### Authentication

#### Login

```
POST /api/auth/login
```

```json
{ "email": "user@example.com", "password": "password123" }
```

**Response** `200` — Sets session cookie.

```json
{ "success": true }
```

#### Register

```
POST /api/auth/register
```

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

Password must be at least 6 characters. Creates a workspace and demo pages on success.

**Response** `200`

```json
{ "success": true }
```

#### Logout

```
POST /api/auth/logout
```

**Response** `200`

```json
{ "success": true }
```

### Pages

#### List Pages

```
GET /api/pages?workspace_id=...&parent_id=...
```

**Response** `200`

```json
{ "pages": [ ... ] }
```

#### Create Page

```
POST /api/pages
```

```json
{
  "workspaceId": "01HABC...",
  "parentId": null,
  "title": "New Page",
  "icon": "📄",
  "content": { "type": "doc", "content": [] }
}
```

#### Get Page

```
GET /api/pages/:id
```

#### Update Page

```
PATCH /api/pages/:id
```

```json
{
  "title": "Updated",
  "icon": "🚀",
  "cover": "https://...",
  "content": { ... },
  "properties": { ... }
}
```

#### Delete Page

```
DELETE /api/pages/:id?permanent=true
```

#### Export Page

```
GET /api/pages/:id/export?format=markdown
```

Returns file download. Supported formats: `markdown` (default), `html`.

#### Duplicate Page

```
POST /api/pages/:id/duplicate
```

```json
{ "includeSubpages": true }
```

**Response** `200`

```json
{
  "page": { ... },
  "allPages": [ ... ],
  "count": 5
}
```

#### Move Page

```
POST /api/pages/move
```

```json
{ "pageId": "01HXYZ...", "newParentId": "01HPARENT..." }
```

Prevents circular references and self-parenting.

#### Restore Page (from trash)

```
POST /api/pages/:id/restore
```

#### Reorder Pages

```
POST /api/pages/reorder
```

```json
{ "pageIds": ["01H1...", "01H2...", "01H3..."] }
```

#### Page Versions

```
GET  /api/pages/:id/versions          — List versions (max 50)
POST /api/pages/:id/versions          — Create version snapshot
```

```json
{ "changeDescription": "Added introduction section" }
```

#### Page Sharing

```
GET    /api/pages/:id/share           — Get share status
POST   /api/pages/:id/share           — Create/enable public share
DELETE /api/pages/:id/share           — Remove public share
```

Create share request:

```json
{
  "allowEditing": false,
  "expiresIn": 86400
}
```

`expiresIn` is seconds from now. Returns a share object with `id` used in the public URL: `/share/:shareId`

#### Page Tags

```
GET    /api/pages/:id/tags            — List tags on page
POST   /api/pages/:id/tags            — Add tag to page
DELETE /api/pages/:id/tags            — Remove tag from page
```

```json
{ "tagId": "01HTAG..." }
```

#### Subscribe to Updates (SSE)

```
GET /api/pages/:id/subscribe
```

Server-Sent Events stream. Emits `connected` on open and `update` events when the page changes. Heartbeat every 30 seconds.

### Favorites

```
GET    /api/favorites                 — List favorited pages
POST   /api/favorites                 — Add favorite
DELETE /api/favorites                 — Remove favorite
```

```json
{ "pageId": "01HXYZ..." }
```

### Tags

```
GET    /api/tags?workspace_id=...     — List workspace tags
POST   /api/tags                      — Create tag
DELETE /api/tags                      — Delete tag (cascades)
```

Create:

```json
{
  "workspaceId": "01HABC...",
  "name": "Important",
  "color": "#ef4444"
}
```

### API Keys

```
GET    /api/api-keys                  — List keys (hash excluded)
POST   /api/api-keys                  — Create key (returns full key once)
DELETE /api/api-keys/:id              — Revoke key
```

Create:

```json
{
  "name": "CI/CD Pipeline",
  "expiresIn": "90d"
}
```

Supported `expiresIn` values: `30d`, `90d`, `1y`, or omit for no expiry.

### Notifications

```
GET    /api/notifications?status=unread&limit=50
POST   /api/notifications
GET    /api/notifications/:id
PATCH  /api/notifications/:id
DELETE /api/notifications/:id
```

Same structure as v1 but uses `camelCase` field names (`imageUrl`, `videoUrl`, `linkUrl`, `linkText`, `pageId`, `snoozedUntil`, `readAt`, `archivedAt`).

### Recent Pages

```
GET  /api/recent                      — Last 10 viewed pages
POST /api/recent                      — Record page view
```

```json
{ "pageId": "01HXYZ..." }
```

### User

```
PATCH /api/user                       — Update profile
GET   /api/user/tour                  — Get tour status
POST  /api/user/tour                  — Mark tour completed
```

### Workspace

```
GET   /api/workspace                  — Get workspace
PATCH /api/workspace                  — Update name
GET   /api/workspace/export           — Export all pages as JSON
```

### Backup / Restore

```
GET  /api/backup                      — Download full backup (JSON)
POST /api/restore                     — Restore from backup JSON
```

Restore clears all existing data before importing. API keys are excluded from backups for security.

### Templates

```
GET /api/templates                    — List page templates (public, no auth)
```

### Health Check

```
GET /api/health                       — No auth required
```

**Response** `200` or `503`

```json
{
  "status": "healthy",
  "database": "connected",
  "version": "1.0.0",
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

### Public Page

```
GET /api/public/:shareId              — No auth required
```

Returns page content and share metadata. Returns `410` if share has expired.

---

## Error Responses

All errors follow this format:

```json
{
  "error": "not_found",
  "message": "Page not found"
}
```

| Status | Meaning |
|--------|---------|
| `200` / `201` | Success |
| `400` | Validation error |
| `401` | Missing or invalid authentication |
| `404` | Resource not found |
| `410` | Resource expired (e.g., share link) |
| `500` | Server error |
| `503` | Service unavailable |

---

## Data Models

### Page

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | ULID identifier |
| `workspace_id` | string | Parent workspace |
| `parent_id` | string? | Parent page (null = root) |
| `title` | string | Page title |
| `icon` | string? | Emoji icon |
| `cover` | string? | Cover image URL |
| `path` | string[] | Ancestor page IDs |
| `depth` | number | Nesting depth (0 = root) |
| `position` | number | Sort order within siblings |
| `is_template` | boolean | Whether page is a template |
| `properties` | object | Custom key-value properties |
| `content` | object | TipTap JSON document |
| `created_at` | string | ISO 8601 timestamp |
| `updated_at` | string | ISO 8601 timestamp |

### Notification

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | ULID identifier |
| `type` | string | Notification type |
| `title` | string | Title text |
| `message` | string? | Body text |
| `image_url` | string? | Image to display |
| `video_url` | string? | Video to embed |
| `link_url` | string? | Clickable URL |
| `link_text` | string? | Link display text |
| `metadata` | object | Arbitrary metadata |
| `page_id` | string? | Related page for navigation |
| `status` | string | `unread`, `read`, `snoozed`, `accepted`, `archived` |
| `snoozed_until` | string? | Snooze expiry (ISO 8601) |
| `created_at` | string | ISO 8601 timestamp |
| `read_at` | string? | When marked read |
| `archived_at` | string? | When archived |

### API Key

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | ULID identifier |
| `name` | string | Display name |
| `prefix` | string | First 8 characters of key |
| `created_at` | string | ISO 8601 timestamp |
| `last_used_at` | string? | Last API call timestamp |
| `expires_at` | string? | Expiry timestamp |
