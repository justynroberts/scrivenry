/**
 * Admin audit log utilities
 */

import { db } from '@/lib/db'
import { adminAuditLog } from '@/lib/db/schema'
import { ulid } from 'ulid'

export type AdminAction =
  | 'user_created'
  | 'user_deleted'
  | 'password_reset'
  | 'role_changed'
  | 'user_deactivated'
  | 'user_activated'
  | 'admin_granted'
  | 'admin_revoked'

export async function logAdminAction(
  adminId: string,
  action: AdminAction,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>
) {
  await db.insert(adminAuditLog).values({
    id: ulid(),
    adminId,
    action,
    targetType,
    targetId,
    details: details ?? {},
  })
}
