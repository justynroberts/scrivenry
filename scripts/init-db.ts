import Database from 'better-sqlite3'
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'fs'
import { dirname, join } from 'path'

const dbPath = './data/scrivenry.db'

// Ensure data directory exists
const dbDir = dirname(dbPath)
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true })
}

const sqlite = new Database(dbPath)

// Enable WAL mode
sqlite.pragma('journal_mode = WAL')

// IMPORTANT: Disable foreign keys during schema creation
// (migrations have tables in wrong order - FK references before table exists)
sqlite.pragma('foreign_keys = OFF')

// Get all migration files sorted by name
const drizzleDir = join(__dirname, '../drizzle')
const migrationFiles = readdirSync(drizzleDir)
  .filter(f => f.endsWith('.sql'))
  .sort()

console.log(`Found ${migrationFiles.length} migration files`)

// Apply each migration in order
for (const file of migrationFiles) {
  console.log(`\nApplying migration: ${file}`)
  const migrationPath = join(drizzleDir, file)
  const migration = readFileSync(migrationPath, 'utf-8')

  // Split by statement-breakpoint and execute each
  const statements = migration.split('--> statement-breakpoint')

  for (const stmt of statements) {
    const trimmed = stmt.trim()
    if (trimmed) {
      try {
        sqlite.exec(trimmed)
        console.log('  Executed:', trimmed.substring(0, 50) + '...')
      } catch (err) {
        // Ignore if table/index already exists
        if (!(err instanceof Error) || !err.message.includes('already exists')) {
          console.error('  Error executing:', trimmed.substring(0, 50))
          console.error(' ', err)
        }
      }
    }
  }
}

// Re-enable foreign keys after schema is created
sqlite.pragma('foreign_keys = ON')

console.log('\nDatabase initialized successfully!')
sqlite.close()
