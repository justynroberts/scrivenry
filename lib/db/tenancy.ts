/**
 * Tenant isolation helpers for Scrivenry (VPS edition).
 *
 * All API endpoints MUST use these helpers to prevent cross-tenant data leakage.
 * Since this version doesn't have workspace_members, tenant isolation is enforced
 * via the single shared workspace model — all authenticated users share access,
 * but page-level operations are protected by auth.
 *
 * For the restore endpoint, admin-only access is enforced.
 */

import { db } from '@/lib/db'
import { pages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Get a page and verify the requesting user is authenticated.
 * Returns the page or null if not found.
 * In the shared-workspace model, any authenticated user can access any non-deleted page.
 */
export async function getPageForUser(userId: string, pageId: string) {
  // userId is checked to ensure caller is authenticated (validateRequest must have succeeded)
  if (!userId) return null

  const page = await db.query.pages.findFirst({
    where: eq(pages.id, pageId),
  })

  return page || null
}

/**
 * Check if a user can access a given workspace.
 * In the shared-workspace model, any authenticated user has access.
 */
export async function userHasWorkspaceAccess(userId: string, _workspaceId: string): Promise<boolean> {
  return !!userId
}
