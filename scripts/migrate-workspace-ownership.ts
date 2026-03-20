import Database from 'better-sqlite3'
import { ulid } from 'ulid'
import path from 'path'

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'scrivenry.db')
console.log(`Opening database at: ${dbPath}`)

const db = new Database(dbPath)

// 1. Add owner_id column if not exists
const cols = db.pragma('table_info(workspaces)') as any[]
const hasOwnerId = cols.some((c: any) => c.name === 'owner_id')

if (!hasOwnerId) {
  console.log('Adding owner_id column to workspaces...')

  // Get the first user (admin/primary user)
  const firstUser = db.prepare('SELECT id, email FROM users ORDER BY created_at ASC LIMIT 1').get() as any
  if (!firstUser) {
    console.error('❌ No users found. Create a user first.')
    process.exit(1)
  }

  console.log(`Defaulting existing workspaces to owner: ${firstUser.email} (${firstUser.id})`)

  // SQLite requires a DEFAULT when adding NOT NULL column to existing table
  db.exec(`ALTER TABLE workspaces ADD COLUMN owner_id TEXT NOT NULL DEFAULT '${firstUser.id}'`)
  console.log(`✅ Added owner_id column (defaulted to ${firstUser.email})`)
} else {
  console.log('⏭️  owner_id column already exists')
}

// 2. Ensure all workspaces have an owner_id (fix any nulls)
const orphanCount = (db.prepare(
  "SELECT COUNT(*) as count FROM workspaces WHERE owner_id IS NULL OR owner_id = ''"
).get() as any).count

if (orphanCount > 0) {
  const firstUser = db.prepare('SELECT id FROM users ORDER BY created_at ASC LIMIT 1').get() as any
  db.prepare("UPDATE workspaces SET owner_id = ? WHERE owner_id IS NULL OR owner_id = ''").run(firstUser.id)
  console.log(`✅ Fixed ${orphanCount} workspaces without owner_id`)
}

// 3. Ensure every user has at least one workspace
const allUsers = db.prepare('SELECT id, email FROM users').all() as any[]
console.log(`\nChecking ${allUsers.length} users for workspace ownership...`)

for (const user of allUsers) {
  const existing = db.prepare('SELECT id, name FROM workspaces WHERE owner_id = ?').get(user.id) as any
  if (!existing) {
    const wsId = ulid()
    const now = Date.now()
    const emailPrefix = user.email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const slug = `workspace-${emailPrefix}-${wsId.slice(-6).toLowerCase()}`

    db.prepare(`
      INSERT INTO workspaces (id, name, slug, owner_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(wsId, `${user.email}'s Workspace`, slug, user.id, now, now)

    console.log(`✅ Created workspace for ${user.email}: ${slug}`)
  } else {
    console.log(`   ${user.email} → workspace: ${existing.name} (id: ${existing.id})`)
  }
}

// 4. Report final state
console.log('\n--- Final workspace ownership ---')
const finalWorkspaces = db.prepare(`
  SELECT w.id, w.name, w.slug, w.owner_id, u.email
  FROM workspaces w
  LEFT JOIN users u ON w.owner_id = u.id
`).all() as any[]

for (const ws of finalWorkspaces) {
  console.log(`  Workspace ${ws.name} (slug: ${ws.slug}) → owner: ${ws.email || 'UNKNOWN'}`)
}

console.log(`\n✅ Migration complete. ${finalWorkspaces.length} workspace(s) total.`)
db.close()
