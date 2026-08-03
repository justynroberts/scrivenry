#!/usr/bin/env node
/**
 * Migration: Add admin columns and audit log table
 * Run: node scripts/migrate-admin.js [--seed-admin email]
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(__dirname, '../data/scrivenry.db')
console.log(`Using database: ${dbPath}`)

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// 1. Add is_admin column (if not exists)
const userCols = db.prepare("PRAGMA table_info(users)").all()
const hasIsAdmin = userCols.some(c => c.name === 'is_admin')
const hasIsActive = userCols.some(c => c.name === 'is_active')
const hasLastActiveAt = userCols.some(c => c.name === 'last_active_at')

if (!hasIsAdmin) {
  db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")
  console.log('✅ Added is_admin column to users')
} else {
  console.log('⏭  is_admin column already exists')
}

if (!hasIsActive) {
  db.exec("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1")
  console.log('✅ Added is_active column to users')
} else {
  console.log('⏭  is_active column already exists')
}

if (!hasLastActiveAt) {
  db.exec("ALTER TABLE users ADD COLUMN last_active_at INTEGER")
  console.log('✅ Added last_active_at column to users')
} else {
  console.log('⏭  last_active_at column already exists')
}

// 2. Create admin_audit_log table
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_audit_log (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES users(id)
  )
`)
console.log('✅ Created admin_audit_log table (if not exists)')

// 3. Promote admin accounts.
// Addresses come from `--seed-admin <email>` or ADMIN_EMAILS (comma-separated).
// Nothing is hardcoded, so running this against any deployment is safe.
const flagIndex = process.argv.indexOf('--seed-admin')
const seedEmails = (
  flagIndex !== -1 && process.argv[flagIndex + 1]
    ? [process.argv[flagIndex + 1]]
    : (process.env.ADMIN_EMAILS || '').split(',')
)
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

if (seedEmails.length === 0) {
  console.log('⏭  No admin emails supplied (--seed-admin <email> or ADMIN_EMAILS) — skipping')
}

for (const email of seedEmails) {
  const user = db.prepare("SELECT id, is_admin FROM users WHERE email = ?").get(email)
  if (!user) {
    console.log(`⚠️  User ${email} not found — skipping`)
  } else if (user.is_admin) {
    console.log(`⏭  ${email} is already admin`)
  } else {
    db.prepare("UPDATE users SET is_admin = 1 WHERE email = ?").run(email)
    console.log(`✅ Marked ${email} as admin`)
  }
}

console.log('\n🎉 Admin migration complete!')
console.log(`   Admin users: ${db.prepare("SELECT email FROM users WHERE is_admin = 1").all().map(u => u.email).join(', ')}`)
