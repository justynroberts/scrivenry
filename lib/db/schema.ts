import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// Workspaces - top-level containers
export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(), // ULID
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  icon: text('icon'),
  settings: text('settings', { mode: 'json' }).$type<Record<string, unknown>>().default({}),
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
