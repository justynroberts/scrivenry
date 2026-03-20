/**
 * Tenant isolation helpers for Scrivenry (VPS edition).
 *
 * SECURITY: Each user can only access pages they created (createdBy = userId).
 * The workspace is shared but all page data is scoped per user.
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
 * Get the shared workspace (all users share one workspace on VPS edition).
 * Access check: any authenticated user can use the shared workspace,
 * but pages within it are scoped by createdBy.
 */
export async function userHasWorkspaceAccess(userId: string, _workspaceId: string): Promise<boolean> {
  return !!userId
}

/**
 * Get the workspace ID for the shared workspace.
 */
export async function getDefaultWorkspaceId(): Promise<string | null> {
  const workspace = await db.query.workspaces.findFirst()
  return workspace?.id ?? null
}

// Alias for API key routes
export const getPageForApiUser = getPageForUser
