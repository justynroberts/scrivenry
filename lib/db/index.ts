import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './data/scrivenry.db'

// Ensure data directory exists
const dbDir = dirname(dbPath)
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true })
}

const sqlite = new Database(dbPath)

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL')

// Checkpoint aggressively: flush WAL to main DB after every 50 pages written.
// Default is 1000 which risks data loss if container restarts before threshold is hit.
// With directory bind mount + this setting, data is doubly protected.
sqlite.pragma('wal_autocheckpoint = 50')

// Enable foreign keys
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

export { schema }
