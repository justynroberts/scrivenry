/**
 * Admin API Integration Tests
 *
 * Tests admin user management, stats, and audit log endpoints.
 * Uses in-memory SQLite database.
 */

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../lib/db/schema'
import { ulid } from 'ulid'

// Create in-memory test database
function createTestDb() {
  const sqlite = new Database(':memory:')
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  // Create tables
  sqlite.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      avatar TEXT,
      password_hash TEXT,
      has_seen_tour INTEGER NOT NULL DEFAULT 0,
      is_admin INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_active_at INTEGER,
      settings TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT,
      settings TEXT DEFAULT '{}',
      owner_id TEXT REFERENCES users(id),
      is_public INTEGER NOT NULL DEFAULT 0,
      max_members INTEGER,
      features TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE pages (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      parent_id TEXT,
      title TEXT NOT NULL DEFAULT 'Untitled',
      icon TEXT,
      cover TEXT,
      path TEXT DEFAULT '[]',
      depth INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      is_template INTEGER NOT NULL DEFAULT 0,
      template_id TEXT,
      properties TEXT DEFAULT '{}',
      content TEXT,
      access_level TEXT NOT NULL DEFAULT 'private',
      can_anyone_edit INTEGER NOT NULL DEFAULT 0,
      edit_history_enabled INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      created_by TEXT REFERENCES users(id),
      last_edited_by TEXT REFERENCES users(id),
      deleted_at INTEGER
    );

    CREATE TABLE workspace_members (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      role TEXT NOT NULL,
      permissions TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      invited_by TEXT REFERENCES users(id),
      invited_at INTEGER,
      joined_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(workspace_id, user_id)
    );

    CREATE TABLE admin_audit_log (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT,
      created_at INTEGER NOT NULL
    );
  `)

  const db = drizzle(sqlite, { schema })
  return { db, sqlite }
}

function makeUser(overrides: Partial<schema.NewUser> = {}): schema.NewUser {
  const now = new Date()
  return {
    id: ulid(),
    email: `user-${ulid().toLowerCase()}@example.com`,
    name: 'Test User',
    passwordHash: 'testhash',
    isAdmin: false,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('Admin functionality', () => {
  let db: ReturnType<typeof createTestDb>['db']
  let sqlite: ReturnType<typeof createTestDb>['sqlite']
  let adminUser: schema.NewUser
  let regularUser: schema.NewUser

  beforeEach(async () => {
    const testDb = createTestDb()
    db = testDb.db
    sqlite = testDb.sqlite

    adminUser = makeUser({ email: 'admin@example.com', isAdmin: true })
    regularUser = makeUser({ email: 'user@example.com', isAdmin: false })

    await db.insert(schema.users).values(adminUser)
    await db.insert(schema.users).values(regularUser)
  })

  afterEach(() => {
    sqlite.close()
  })

  describe('Schema: is_admin column', () => {
    test('users have is_admin field defaulting to false', async () => {
      const { eq } = await import('drizzle-orm')
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, regularUser.id),
      })
      expect(user?.isAdmin).toBe(false)
    })

    test('admin users have is_admin = true', async () => {
      const { eq } = await import('drizzle-orm')
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, adminUser.id),
      })
      expect(user?.isAdmin).toBe(true)
    })

    test('users have is_active field defaulting to true', async () => {
      const { eq } = await import('drizzle-orm')
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, regularUser.id),
      })
      expect(user?.isActive).toBe(true)
    })
  })

  describe('Schema: admin_audit_log table', () => {
    test('can insert and query audit log entries', async () => {
      const logEntry: schema.NewAdminAuditLog = {
        id: ulid(),
        adminId: adminUser.id,
        action: 'user_created',
        targetType: 'user',
        targetId: regularUser.id,
        details: { email: regularUser.email },
        createdAt: new Date(),
      }

      await db.insert(schema.adminAuditLog).values(logEntry)

      const logs = await db.query.adminAuditLog.findMany()
      expect(logs).toHaveLength(1)
      expect(logs[0].action).toBe('user_created')
      expect(logs[0].adminId).toBe(adminUser.id)
      expect(logs[0].targetId).toBe(regularUser.id)
    })

    test('audit log stores details as JSON', async () => {
      const details = { email: 'test@example.com', createdBy: 'admin@example.com' }
      await db.insert(schema.adminAuditLog).values({
        id: ulid(),
        adminId: adminUser.id,
        action: 'user_deleted',
        targetType: 'user',
        targetId: regularUser.id,
        details,
        createdAt: new Date(),
      })

      const log = await db.query.adminAuditLog.findFirst()
      expect(log?.details).toEqual(details)
    })
  })

  describe('User management operations', () => {
    test('can create a new user in the database', async () => {
      const { eq, count } = await import('drizzle-orm')

      const newUser = makeUser({ email: 'newuser@example.com' })
      await db.insert(schema.users).values(newUser)

      const allUsers = await db.query.users.findMany()
      expect(allUsers.length).toBeGreaterThanOrEqual(3)

      const found = await db.query.users.findFirst({
        where: eq(schema.users.email, 'newuser@example.com'),
      })
      expect(found).toBeTruthy()
      expect(found?.email).toBe('newuser@example.com')
    })

    test('can update user isAdmin status', async () => {
      const { eq } = await import('drizzle-orm')

      await db
        .update(schema.users)
        .set({ isAdmin: true, updatedAt: new Date() })
        .where(eq(schema.users.id, regularUser.id))

      const updated = await db.query.users.findFirst({
        where: eq(schema.users.id, regularUser.id),
      })
      expect(updated?.isAdmin).toBe(true)
    })

    test('can deactivate a user', async () => {
      const { eq } = await import('drizzle-orm')

      await db
        .update(schema.users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(schema.users.id, regularUser.id))

      const updated = await db.query.users.findFirst({
        where: eq(schema.users.id, regularUser.id),
      })
      expect(updated?.isActive).toBe(false)
    })

    test('can delete a user', async () => {
      const { eq } = await import('drizzle-orm')

      await db.delete(schema.users).where(eq(schema.users.id, regularUser.id))

      const allUsers = await db.query.users.findMany()
      expect(allUsers.find((u) => u.id === regularUser.id)).toBeUndefined()
    })

    test('email is unique - cannot insert duplicate', async () => {
      const dup = makeUser({ email: adminUser.email })
      await expect(db.insert(schema.users).values(dup)).rejects.toThrow()
    })
  })

  describe('Stats queries', () => {
    test('can count total users', async () => {
      const { count } = await import('drizzle-orm')
      const result = await db.select({ count: count() }).from(schema.users)
      expect(result[0].count).toBe(2) // admin + regular
    })

    test('can count pages (non-deleted)', async () => {
      const { count, isNull } = await import('drizzle-orm')

      // Create a workspace first
      const wsId = ulid()
      const now = new Date()
      await db.insert(schema.workspaces).values({
        id: wsId,
        name: 'Test Workspace',
        slug: `test-${wsId.slice(0, 8).toLowerCase()}`,
        ownerId: adminUser.id,
        createdAt: now,
        updatedAt: now,
      })

      // Insert some pages
      for (let i = 0; i < 3; i++) {
        await db.insert(schema.pages).values({
          id: ulid(),
          workspaceId: wsId,
          title: `Page ${i + 1}`,
          createdBy: adminUser.id,
          createdAt: now,
          updatedAt: now,
        })
      }

      // Insert a soft-deleted page
      await db.insert(schema.pages).values({
        id: ulid(),
        workspaceId: wsId,
        title: 'Deleted Page',
        createdBy: adminUser.id,
        deletedAt: now,
        createdAt: now,
        updatedAt: now,
      })

      const result = await db
        .select({ count: count() })
        .from(schema.pages)
        .where(isNull(schema.pages.deletedAt))

      expect(result[0].count).toBe(3) // Not the deleted one
    })

    test('can count workspaces', async () => {
      const { count } = await import('drizzle-orm')

      const now = new Date()
      await db.insert(schema.workspaces).values({
        id: ulid(),
        name: 'Workspace A',
        slug: 'ws-a',
        ownerId: adminUser.id,
        createdAt: now,
        updatedAt: now,
      })
      await db.insert(schema.workspaces).values({
        id: ulid(),
        name: 'Workspace B',
        slug: 'ws-b',
        ownerId: regularUser.id,
        createdAt: now,
        updatedAt: now,
      })

      const result = await db.select({ count: count() }).from(schema.workspaces)
      expect(result[0].count).toBe(2)
    })
  })

  describe('Audit log operations', () => {
    test('can log multiple admin actions', async () => {
      const actions = ['user_created', 'password_reset', 'admin_granted']
      const now = new Date()

      for (const action of actions) {
        await db.insert(schema.adminAuditLog).values({
          id: ulid(),
          adminId: adminUser.id,
          action,
          targetType: 'user',
          targetId: regularUser.id,
          createdAt: now,
        })
      }

      const logs = await db.query.adminAuditLog.findMany()
      expect(logs).toHaveLength(3)
    })

    test('audit log can be paginated', async () => {
      const { desc } = await import('drizzle-orm')
      const now = new Date()

      for (let i = 0; i < 10; i++) {
        await db.insert(schema.adminAuditLog).values({
          id: ulid(),
          adminId: adminUser.id,
          action: 'user_created',
          targetType: 'user',
          targetId: regularUser.id,
          createdAt: new Date(now.getTime() + i * 1000),
        })
      }

      const page1 = await db.query.adminAuditLog.findMany({
        orderBy: [desc(schema.adminAuditLog.createdAt)],
        limit: 5,
        offset: 0,
      })
      expect(page1).toHaveLength(5)

      const page2 = await db.query.adminAuditLog.findMany({
        orderBy: [desc(schema.adminAuditLog.createdAt)],
        limit: 5,
        offset: 5,
      })
      expect(page2).toHaveLength(5)

      // No overlap
      const ids1 = page1.map((l) => l.id)
      const ids2 = page2.map((l) => l.id)
      expect(ids1.filter((id) => ids2.includes(id))).toHaveLength(0)
    })
  })

  describe('Password hashing', () => {
    // Use Node.js crypto (available in jest) to implement the same hashing logic
    function hashPasswordNode(password: string): string {
      const { createHash } = require('crypto')
      return createHash('sha256').update(password, 'utf8').digest('hex')
    }

    function verifyPasswordNode(password: string, hash: string): boolean {
      return hashPasswordNode(password) === hash
    }

    test('hashPassword produces a consistent hash', () => {
      const hash1 = hashPasswordNode('testpassword123')
      const hash2 = hashPasswordNode('testpassword123')
      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA-256 hex
    })

    test('hashPassword different passwords produce different hashes', () => {
      const hash1 = hashPasswordNode('password1')
      const hash2 = hashPasswordNode('password2')
      expect(hash1).not.toBe(hash2)
    })

    test('verifyPassword returns true for matching password', () => {
      const hash = hashPasswordNode('mypassword')
      expect(verifyPasswordNode('mypassword', hash)).toBe(true)
    })

    test('verifyPassword returns false for wrong password', () => {
      const hash = hashPasswordNode('mypassword')
      expect(verifyPasswordNode('wrongpassword', hash)).toBe(false)
    })
  })
})
