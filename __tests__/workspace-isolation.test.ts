import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import Database from 'better-sqlite3'
import { ulid } from 'ulid'
import path from 'path'
import fs from 'fs'

// ============================================================================
// Workspace Isolation Tests — Scrivenry
// Tests that User A CANNOT access User B's workspaces or pages.
// ============================================================================

const TEST_DB_PATH = '/tmp/test-isolation-' + Date.now() + '.db'

function setupTestDb(): Database.Database {
  const db = new Database(TEST_DB_PATH)

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      is_admin INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      has_seen_tour INTEGER NOT NULL DEFAULT 0,
      settings TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      owner_id TEXT NOT NULL,
      icon TEXT,
      settings TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      parent_id TEXT,
      title TEXT NOT NULL DEFAULT 'Untitled',
      depth INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      is_template INTEGER NOT NULL DEFAULT 0,
      properties TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      created_by TEXT,
      last_edited_by TEXT,
      deleted_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#8b5cf6',
      created_at INTEGER NOT NULL
    );
  `)

  return db
}

function createUser(db: Database.Database, email: string): any {
  const id = ulid()
  const now = Date.now()
  db.prepare('INSERT INTO users (id, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(id, email, email.split('@')[0], now, now)
  return { id, email }
}

function createWorkspace(db: Database.Database, ownerId: string, name: string): any {
  const id = ulid()
  const now = Date.now()
  const slug = 'workspace-' + id.slice(-6).toLowerCase()
  db.prepare('INSERT INTO workspaces (id, name, slug, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, name, slug, ownerId, now, now)
  return { id, name, slug, ownerId }
}

function createPage(db: Database.Database, workspaceId: string, createdBy: string, title: string): any {
  const id = ulid()
  const now = Date.now()
  db.prepare('INSERT INTO pages (id, workspace_id, title, created_by, last_edited_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, workspaceId, title, createdBy, createdBy, now, now)
  return { id, workspaceId, title, createdBy }
}

function createTag(db: Database.Database, workspaceId: string, name: string): any {
  const id = ulid()
  const now = Date.now()
  db.prepare('INSERT INTO tags (id, workspace_id, name, created_at) VALUES (?, ?, ?, ?)').run(id, workspaceId, name, now)
  return { id, workspaceId, name }
}

// Tenant-aware query helpers (mirrors API endpoint logic)
function getWorkspacesForUser(db: Database.Database, userId: string): any[] {
  return db.prepare('SELECT * FROM workspaces WHERE owner_id = ?').all(userId) as any[]
}

function getWorkspaceForUser(db: Database.Database, userId: string, workspaceId: string): any {
  return db.prepare('SELECT * FROM workspaces WHERE id = ? AND owner_id = ?').get(workspaceId, userId)
}

function getPagesForUser(db: Database.Database, userId: string, workspaceId?: string): any[] {
  if (workspaceId) {
    const ws = getWorkspaceForUser(db, userId, workspaceId)
    if (!ws) return []
    return db.prepare('SELECT * FROM pages WHERE created_by = ? AND workspace_id = ? AND deleted_at IS NULL').all(userId, workspaceId) as any[]
  }
  return db.prepare('SELECT * FROM pages WHERE created_by = ? AND deleted_at IS NULL').all(userId) as any[]
}

function getTagsForWorkspace(db: Database.Database, userId: string, workspaceId: string): any[] | null {
  const ws = getWorkspaceForUser(db, userId, workspaceId)
  if (!ws) return null
  return db.prepare('SELECT * FROM tags WHERE workspace_id = ?').all(workspaceId) as any[]
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Workspace Ownership Isolation', () => {
  let db: Database.Database
  let userA: any, userB: any, wsA: any, wsB: any

  beforeEach(() => {
    db = setupTestDb()
    userA = createUser(db, 'a@test.com')
    userB = createUser(db, 'b@test.com')
    wsA = createWorkspace(db, userA.id, 'User A Workspace')
    wsB = createWorkspace(db, userB.id, 'User B Workspace')
  })

  afterEach(() => {
    db.close()
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH)
  })

  it('User A cannot list User B workspaces', () => {
    const workspaces = getWorkspacesForUser(db, userA.id)
    expect(workspaces.map((w: any) => w.id)).not.toContain(wsB.id)
    expect(workspaces.map((w: any) => w.id)).toContain(wsA.id)
    expect(workspaces).toHaveLength(1)
  })

  it('User B cannot list User A workspaces', () => {
    const workspaces = getWorkspacesForUser(db, userB.id)
    expect(workspaces.map((w: any) => w.id)).not.toContain(wsA.id)
    expect(workspaces.map((w: any) => w.id)).toContain(wsB.id)
    expect(workspaces).toHaveLength(1)
  })

  it('User A cannot access User B workspace by ID', () => {
    const workspace = getWorkspaceForUser(db, userA.id, wsB.id)
    expect(workspace).toBeFalsy()
  })

  it('User A can access their own workspace by ID', () => {
    const workspace = getWorkspaceForUser(db, userA.id, wsA.id)
    expect(workspace).toBeTruthy()
    expect(workspace.id).toBe(wsA.id)
    expect(workspace.owner_id).toBe(userA.id)
  })

  it('User A cannot access User B pages via User B workspace', () => {
    const pageB = createPage(db, wsB.id, userB.id, 'Secret B Page')
    const pages = getPagesForUser(db, userA.id, wsB.id)
    expect(pages).toHaveLength(0)
    expect(pages.map((p: any) => p.id)).not.toContain(pageB.id)
  })

  it('User A can access their own pages', () => {
    const pageA1 = createPage(db, wsA.id, userA.id, 'My Page 1')
    const pageA2 = createPage(db, wsA.id, userA.id, 'My Page 2')
    const pages = getPagesForUser(db, userA.id, wsA.id)
    expect(pages.map((p: any) => p.id)).toContain(pageA1.id)
    expect(pages.map((p: any) => p.id)).toContain(pageA2.id)
    expect(pages).toHaveLength(2)
  })

  it('User A pages are not visible to User B (createdBy isolation)', () => {
    const pageA = createPage(db, wsA.id, userA.id, 'A Private Page')
    const pages = getPagesForUser(db, userB.id)
    expect(pages.map((p: any) => p.id)).not.toContain(pageA.id)
  })

  it('User A cannot access User B tags via User B workspace', () => {
    createTag(db, wsB.id, 'User B Secret Tag')
    const result = getTagsForWorkspace(db, userA.id, wsB.id)
    expect(result).toBeNull()
  })

  it('User A can access their own workspace tags', () => {
    const tag = createTag(db, wsA.id, 'My Tag')
    const result = getTagsForWorkspace(db, userA.id, wsA.id)
    expect(result).not.toBeNull()
    expect(result!.map((t: any) => t.id)).toContain(tag.id)
  })

  it('Multiple users have completely separate workspace sets', () => {
    const wsA2 = createWorkspace(db, userA.id, 'A Second Workspace')
    const forA = getWorkspacesForUser(db, userA.id)
    const forB = getWorkspacesForUser(db, userB.id)

    expect(forA.map((w: any) => w.id)).toContain(wsA.id)
    expect(forA.map((w: any) => w.id)).toContain(wsA2.id)
    expect(forA.map((w: any) => w.id)).not.toContain(wsB.id)

    expect(forB.map((w: any) => w.id)).toContain(wsB.id)
    expect(forB.map((w: any) => w.id)).not.toContain(wsA.id)
    expect(forB.map((w: any) => w.id)).not.toContain(wsA2.id)
  })
})
