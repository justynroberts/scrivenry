#!/usr/bin/env node
/**
 * Startup bootstrap: bring the database up to date, then optionally create the
 * first admin account.
 *
 * Runs before the server starts. Plain CommonJS on purpose — the container has
 * no tsx, so the TypeScript variant (scripts/init-db.ts) cannot run there.
 *
 * The admin account is created only when ADMIN_EMAIL and ADMIN_PASSWORD are
 * both set. There is no default account: a known email and password on a
 * publicly reachable instance is an open door.
 */

const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const { randomUUID } = require('crypto')
const { existsSync, mkdirSync, readdirSync, readFileSync } = require('fs')
const { dirname, join } = require('path')

const dbPath = (process.env.DATABASE_URL || 'file:./data/scrivenry.db').replace(/^file:/, '')
const dbDir = dirname(dbPath)
if (dbDir && !existsSync(dbDir)) mkdirSync(dbDir, { recursive: true })

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
// Migrations reference tables before they are created, so keep FKs off while applying.
db.pragma('foreign_keys = OFF')

// --- Schema ----------------------------------------------------------------

const drizzleDir = join(__dirname, '..', 'drizzle')
const migrations = readdirSync(drizzleDir).filter((f) => f.endsWith('.sql')).sort()
let applied = 0

for (const file of migrations) {
  const sql = readFileSync(join(drizzleDir, file), 'utf-8')
  for (const statement of sql.split('--> statement-breakpoint')) {
    const trimmed = statement.trim()
    if (!trimmed) continue
    try {
      db.exec(trimmed)
      applied++
    } catch (err) {
      // Re-running an applied migration is normal; anything else is not.
      const benign = /already exists|duplicate column name/i.test(err.message)
      if (!benign) {
        console.error(`  migration ${file}: ${err.message}`)
      }
    }
  }
}
console.log(`[bootstrap] schema up to date (${migrations.length} migration files, ${applied} statements applied)`)

// Columns added after the initial migrations shipped.
const columns = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name)
const ensure = {
  is_admin: 'INTEGER NOT NULL DEFAULT 0',
  is_active: 'INTEGER NOT NULL DEFAULT 1',
  last_active_at: 'INTEGER',
}
for (const [name, type] of Object.entries(ensure)) {
  if (!columns.includes(name)) {
    db.exec(`ALTER TABLE users ADD COLUMN ${name} ${type}`)
    console.log(`[bootstrap] added users.${name}`)
  }
}

db.pragma('foreign_keys = ON')

// --- First admin account ---------------------------------------------------

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD || ''

if (!email || !password) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n
  if (count === 0) {
    console.log('[bootstrap] no users yet — set ADMIN_EMAIL and ADMIN_PASSWORD to create one, or register in the UI')
  }
} else if (password.length < 8) {
  console.error('[bootstrap] ADMIN_PASSWORD must be at least 8 characters — admin not created')
} else {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    console.log(`[bootstrap] admin ${email} already exists`)
  } else {
    const now = Math.floor(Date.now() / 1000)
    db.prepare(
      `INSERT INTO users (id, email, name, password_hash, has_seen_tour, is_admin, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, 1, 1, ?, ?)`
    ).run(randomUUID(), email, email.split('@')[0], bcrypt.hashSync(password, 10), now, now)
    console.log(`[bootstrap] created admin ${email}`)
  }
}

db.close()
