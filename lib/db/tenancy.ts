/**
 * Tenant isolation helpers for Scrivenry (VPS edition).
 *
 * SECURITY MODEL (v2 - Notion-style workspace isolation):
 *   - Each workspace is owned by one user (ownerId)
 *   - Users can only access workspaces they own
 *   - Pages are further scoped by createdBy within owned workspaces
 *   - User A cannot see, access, or modify User B's workspaces or pages
 */

import { db } from '@/lib/db'
import { pages, workspaces } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Get a page only if it belongs to the requesting user (createdBy check).
 * Returns the page or null if not found / not owned by the user.
 */
export async function getPageForUser(userId: string, pageId: string) {
  if (!userId) return null

  const page = await db.query.pages.findFirst({
    where: and(
      eq(pages.id, pageId),
      eq(pages.createdBy, userId) // ← TENANT ISOLATION: only own pages
    ),
  })

  return page || null
}

/**
 * Get a workspace only if the user owns it.
 * Returns the workspace or null if not found / not owned by the user.
 */
export async function getWorkspaceForUser(userId: string, workspaceId: string) {
  if (!userId || !workspaceId) return null

  const workspace = await db.query.workspaces.findFirst({
    where: and(
      eq(workspaces.id, workspaceId),
      eq(workspaces.ownerId, userId) // ← WORKSPACE ISOLATION: only own workspaces
    ),
  })

  return workspace || null
}

/**
 * Get the default workspace for a user (their first/only workspace).
 * Each user has exactly one workspace in single-tenant mode.
 */
export async function getDefaultWorkspaceForUser(userId: string) {
  if (!userId) return null

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.ownerId, userId),
  })

  return workspace || null
}

/**
 * Check if a user has access to a workspace.
 * Access is granted only if the user owns the workspace.
 */
export async function userHasWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
  if (!userId || !workspaceId) return false

  const workspace = await getWorkspaceForUser(userId, workspaceId)
  return !!workspace
}

/**
 * Get the workspace ID for the user's default workspace.
 * Used by routes that need a workspace but don't receive one explicitly.
 */
export async function getDefaultWorkspaceId(userId?: string): Promise<string | null> {
  if (userId) {
    const workspace = await getDefaultWorkspaceForUser(userId)
    return workspace?.id ?? null
  }
  // Fallback: first workspace (legacy single-workspace mode)
  const workspace = await db.query.workspaces.findFirst()
  return workspace?.id ?? null
}

// Alias for API key routes
export const getPageForApiUser = getPageForUser
