import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core'

// Workspaces - top-level containers
export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(), // ULID
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  icon: text('icon'),
  settings: text('settings', { mode: 'json' }).$type<Record<string, unknown>>().default({}),
  // Multi-user fields
  ownerId: text('owner_id').references(() => users.id, { onDelete: 'set null' }),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  maxMembers: integer('max_members'), // null = unlimited
  features: text('features', { mode: 'json' }).$type<Record<string, unknown>>().default({}),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Users
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // ULID
  email: text('email').unique().notNull(),
  name: text('name'),
  avatar: text('avatar'),
  passwordHash: text('password_hash'),
  hasSeenTour: integer('has_seen_tour', { mode: 'boolean' }).notNull().default(false),
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastActiveAt: integer('last_active_at', { mode: 'timestamp' }),
  settings: text('settings', { mode: 'json' }).$type<Record<string, unknown>>().default({}),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Sessions for Lucia Auth - expiresAt must be plain integer for Lucia adapter
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
})

// Pages - document containers
export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(), // ULID
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  parentId: text('parent_id').references((): ReturnType<typeof text> => pages.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default('Untitled'),
  icon: text('icon'),
  cover: text('cover'),
  path: text('path', { mode: 'json' }).$type<string[]>().default([]), // Materialized path
  depth: integer('depth').notNull().default(0),
  position: integer('position').notNull().default(0),
  isTemplate: integer('is_template', { mode: 'boolean' }).notNull().default(false),
  templateId: text('template_id'),
  properties: text('properties', { mode: 'json' }).$type<Record<string, unknown>>().default({}),
  content: text('content', { mode: 'json' }).$type<Record<string, unknown>>(), // TipTap JSON content
  // Multi-user access control
  accessLevel: text('access_level').notNull().default('private'), // 'private', 'workspace', 'public', 'link_only'
  canAnyoneEdit: integer('can_anyone_edit', { mode: 'boolean' }).notNull().default(false),
  editHistoryEnabled: integer('edit_history_enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdBy: text('created_by').references(() => users.id),
  lastEditedBy: text('last_edited_by').references(() => users.id),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }), // Soft delete
})

// Blocks - content units (for API and granular operations)
export const blocks = sqliteTable('blocks', {
  id: text('id').primaryKey(), // ULID
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  parentId: text('parent_id').references((): ReturnType<typeof text> => blocks.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // paragraph, heading_1, etc.
  content: text('content', { mode: 'json' }).$type<Record<string, unknown>>().notNull().default({}),
  position: integer('position').notNull().default(0),
  children: text('children', { mode: 'json' }).$type<string[]>().default([]),
  properties: text('properties', { mode: 'json' }).$type<Record<string, unknown>>().default({}),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Page versions for history
export const pageVersions = sqliteTable('page_versions', {
  id: text('id').primaryKey(), // ULID
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  content: text('content', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  title: text('title').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdBy: text('created_by').references(() => users.id),
  changeDescription: text('change_description'),
})

// Favorites - user's starred pages
export const favorites = sqliteTable('favorites', {
  id: text('id').primaryKey(), // ULID
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Tags for page organization
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(), // ULID
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#8b5cf6'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Page Tags junction table
export const pageTags = sqliteTable('page_tags', {
  id: text('id').primaryKey(), // ULID
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Public shares for pages
export const publicShares = sqliteTable('public_shares', {
  id: text('id').primaryKey(), // ULID - used as share token
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').references(() => users.id),
  allowEditing: integer('allow_editing', { mode: 'boolean' }).notNull().default(false),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Recent page views for user
export const recentViews = sqliteTable('recent_views', {
  id: text('id').primaryKey(), // ULID
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  viewedAt: integer('viewed_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// API Keys for programmatic access
export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(), // ULID
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(), // SHA-256
  prefix: text('prefix').notNull(), // First 8 chars for identification
  scopes: text('scopes', { mode: 'json' }).$type<string[]>().default([]),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Notifications - live notification system
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(), // ULID
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'page_created', 'page_updated', 'system', 'custom'
  title: text('title').notNull(),
  message: text('message'),

  // Rich content
  imageUrl: text('image_url'),
  videoUrl: text('video_url'),
  linkUrl: text('link_url'),
  linkText: text('link_text'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>().default({}),

  // Related entities
  pageId: text('page_id').references(() => pages.id, { onDelete: 'set null' }),

  // Status: 'unread', 'read', 'snoozed', 'accepted', 'archived'
  status: text('status').notNull().default('unread'),
  snoozedUntil: integer('snoozed_until', { mode: 'timestamp' }),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  readAt: integer('read_at', { mode: 'timestamp' }),
  archivedAt: integer('archived_at', { mode: 'timestamp' }),
})

// ============================================================
// MULTI-USER TABLES (Phase 1)
// ============================================================

// Workspace Members - tracks user membership & roles
export const workspaceMembers = sqliteTable('workspace_members', {
  id: text('id').primaryKey(), // ULID
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'owner', 'admin', 'editor', 'commenter', 'viewer'
  permissions: text('permissions', { mode: 'json' }).$type<Record<string, unknown>>(), // Custom overrides (nullable)
  status: text('status').notNull().default('active'), // 'active', 'invited', 'pending', 'suspended'
  invitedBy: text('invited_by').references(() => users.id, { onDelete: 'set null' }),
  invitedAt: integer('invited_at', { mode: 'timestamp' }),
  joinedAt: integer('joined_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (t) => ({
  uniqWorkspaceUser: unique().on(t.workspaceId, t.userId),
}))

// Workspace Invitations - email-based and link-based invites
export const workspaceInvitations = sqliteTable('workspace_invitations', {
  id: text('id').primaryKey(), // ULID
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  email: text('email'), // null for link-based invites
  role: text('role').notNull(),
  token: text('token').unique().notNull(), // Shareable invite token
  createdBy: text('created_by').notNull().references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  usedBy: text('used_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Page Permissions - fine-grained per-page access
export const pagePermissions = sqliteTable('page_permissions', {
  id: text('id').primaryKey(), // ULID
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  targetType: text('target_type').notNull(), // 'user', 'role', 'workspace'
  targetId: text('target_id').notNull(),
  permission: text('permission').notNull(), // 'view', 'edit', 'comment', 'admin'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (t) => ({
  uniqPageTarget: unique().on(t.pageId, t.targetType, t.targetId),
}))

// Workspace Audit Log - track all user actions
export const workspaceAuditLog = sqliteTable('workspace_audit_log', {
  id: text('id').primaryKey(), // ULID
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  actorId: text('actor_id').notNull().references(() => users.id),
  action: text('action').notNull(), // 'page_created', 'page_deleted', 'user_invited', etc.
  resourceType: text('resource_type'), // 'page', 'user', 'workspace'
  resourceId: text('resource_id'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Collaboration Sessions - real-time editing tracking
export const collaborationSessions = sqliteTable('collaboration_sessions', {
  id: text('id').primaryKey(), // ULID
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: text('session_token').unique().notNull(),
  cursorPosition: text('cursor_position', { mode: 'json' }).$type<{ line: number; column: number }>(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastActivity: integer('last_activity', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Admin Audit Log - system-level admin actions
export const adminAuditLog = sqliteTable('admin_audit_log', {
  id: text('id').primaryKey(), // ULID
  adminId: text('admin_id').notNull().references(() => users.id),
  action: text('action').notNull(), // 'user_created', 'user_deleted', 'password_reset', 'role_changed', 'user_deactivated'
  targetType: text('target_type'), // 'user', 'workspace', 'page'
  targetId: text('target_id'),
  details: text('details', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Types
export type Workspace = typeof workspaces.$inferSelect
export type NewWorkspace = typeof workspaces.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type Page = typeof pages.$inferSelect
export type NewPage = typeof pages.$inferInsert
export type Block = typeof blocks.$inferSelect
export type NewBlock = typeof blocks.$inferInsert
export type PageVersion = typeof pageVersions.$inferSelect
export type Favorite = typeof favorites.$inferSelect
export type ApiKey = typeof apiKeys.$inferSelect
export type Tag = typeof tags.$inferSelect
export type NewTag = typeof tags.$inferInsert
export type PageTag = typeof pageTags.$inferSelect
export type PublicShare = typeof publicShares.$inferSelect
export type RecentView = typeof recentViews.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert

// Multi-user types
export type WorkspaceMember = typeof workspaceMembers.$inferSelect
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert
export type WorkspaceInvitation = typeof workspaceInvitations.$inferSelect
export type NewWorkspaceInvitation = typeof workspaceInvitations.$inferInsert
export type PagePermission = typeof pagePermissions.$inferSelect
export type NewPagePermission = typeof pagePermissions.$inferInsert
export type WorkspaceAuditLog = typeof workspaceAuditLog.$inferSelect
export type NewWorkspaceAuditLog = typeof workspaceAuditLog.$inferInsert
export type CollaborationSession = typeof collaborationSessions.$inferSelect
export type NewCollaborationSession = typeof collaborationSessions.$inferInsert

// Role type
export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'commenter' | 'viewer'
export type PermissionAction = 'view' | 'edit' | 'delete' | 'invite' | 'admin_settings' | 'delete_workspace' | 'comment' | 'remove_member'

// Admin types
export type AdminAuditLog = typeof adminAuditLog.$inferSelect
export type NewAdminAuditLog = typeof adminAuditLog.$inferInsert
