# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scrivenry is a self-hosted documentation platform with block-based editing (like Notion), built with Next.js 15, TipTap editor, and SQLite. Knowledge. Free. Always.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (port 3847)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Initialize database (first time setup)
npm run db:init

# Generate database migrations
npm run db:generate

# Apply database migrations
npm run db:migrate

# Push schema changes directly (dev only)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Editor**: TipTap with ProseMirror extensions
- **Database**: SQLite via Drizzle ORM (stored in `./data/scrivenry.db`)
- **Auth**: Lucia Auth with email/password
- **Styling**: Tailwind CSS 3.x + Radix UI primitives
- **State**: Zustand + React Query

### Directory Structure
```
app/
├── (auth)/               # Login/register routes
├── (workspace)/          # Main app (requires auth)
│   ├── page/[pageId]/    # Page editor view
│   ├── settings/         # User settings
│   └── workspace/        # Workspace home
├── api/                  # Internal API routes
│   ├── auth/             # Auth endpoints
│   ├── pages/            # Page CRUD
│   └── api-keys/         # API key management
└── api/v1/               # REST API v1 (external)

components/
├── editor/               # TipTap editor components
│   ├── Editor.tsx        # Main editor component
│   ├── SlashCommand.tsx  # "/" command menu
│   └── BubbleMenu.tsx    # Formatting toolbar
├── sidebar/              # Navigation sidebar
└── ui/                   # Radix UI primitives

lib/
├── db/
│   ├── schema.ts         # Drizzle schema definitions
│   └── index.ts          # Database connection
├── auth.ts               # Lucia configuration
└── utils.ts              # Utility functions
```

### Key Data Models
- **Workspace**: Top-level container for pages
- **Page**: Document with nested hierarchy, stores TipTap JSON content
- **Block**: Granular content unit for API operations
- **User/Session**: Authentication via Lucia

## API

### Internal API (for UI)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET/POST /api/pages` - List/create pages
- `GET/PATCH/DELETE /api/pages/[id]` - Page operations
- `GET /api/pages/[id]/export?format=markdown|html` - Export page

### REST API v1 (for external access)
Requires API key in `Authorization: Bearer nf_sk_...` header

- `GET /api/v1/pages` - List pages
- `POST /api/v1/pages` - Create page
- `GET/PATCH/DELETE /api/v1/pages/[id]` - Page operations
- `GET /api/v1/search?q=query` - Search pages

## Docker Deployment

```bash
# Build and run with docker-compose
cd docker
docker-compose up -d

# Access at http://localhost:3847
```

## Database

SQLite database stored at `./data/scrivenry.db`. WAL mode enabled for concurrent access.

```bash
# Initialize database (required on first run)
npm run db:init

# View schema in browser GUI
npm run db:studio

# Reset database (dev only)
rm -rf data/scrivenry.db
npm run db:init
```

## Configuration

Environment variables (optional):
- `DATABASE_URL` - SQLite path (default: `file:./data/scrivenry.db`)
- `NODE_ENV` - `development` or `production`

## Troubleshooting

### 500 Error: "Bad escaped character in JSON"
**Symptom:** All page loads return 500 error with `SyntaxError: Bad escaped character in JSON` in logs.

**Cause:** Invalid JSON escape sequences in page `content` field. JSON only supports `\n \r \t \b \f \\ \" \/ \uXXXX` - shell escapes like `\!` or `\x27` are invalid.

**Fix:**
```bash
# Find problematic pages
sqlite3 data/scrivenry.db "SELECT id, title FROM pages;" | while IFS='|' read -r id title; do
  sqlite3 data/scrivenry.db "SELECT content FROM pages WHERE id = '$id';" 2>/dev/null | \
    python3 -c "import json,sys; json.loads(sys.stdin.read().strip())" 2>/dev/null || \
    echo "Invalid JSON: $id - $title"
done

# Fix invalid escapes (removes backslash before invalid chars)
sqlite3 data/scrivenry.db "SELECT content FROM pages WHERE id = 'PAGE_ID';" > /tmp/fix.json
python3 -c "
import re
with open('/tmp/fix.json') as f: c = f.read().strip()
fixed = re.sub(r'\\\\(?![\"\\\\\/bfnrtu])', '', c)
fixed = re.sub(r'\\\\x([0-9a-fA-F]{2})', lambda m: chr(int(m.group(1), 16)), fixed)
with open('/tmp/fix.json', 'w') as f: f.write(fixed)
"
sqlite3 data/scrivenry.db "UPDATE pages SET content = readfile('/tmp/fix.json') WHERE id = 'PAGE_ID';"
```

## Notes

- Default port is 3847 (non-standard to avoid conflicts)
- Dark theme is enabled by default
- Editor supports `/` slash commands for block types
- Cmd+K opens search dialog
- Pages support infinite nesting
