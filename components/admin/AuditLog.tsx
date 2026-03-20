'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldAlert, RefreshCw, User, Trash2, Key, Shield, UserX, UserCheck } from 'lucide-react'

interface AuditEntry {
  id: string
  action: string
  targetType: string | null
  targetId: string | null
  details: Record<string, unknown> | null
  createdAt: string
  admin: {
    id: string
    email: string
    name: string | null
  }
}

const ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  user_created: { label: 'User Created', icon: User, color: 'text-green-400' },
  user_deleted: { label: 'User Deleted', icon: Trash2, color: 'text-red-400' },
  password_reset: { label: 'Password Reset', icon: Key, color: 'text-yellow-400' },
  role_changed: { label: 'Role Changed', icon: Shield, color: 'text-blue-400' },
  user_deactivated: { label: 'User Deactivated', icon: UserX, color: 'text-orange-400' },
  user_activated: { label: 'User Activated', icon: UserCheck, color: 'text-green-400' },
  admin_granted: { label: 'Admin Granted', icon: ShieldAlert, color: 'text-purple-400' },
  admin_revoked: { label: 'Admin Revoked', icon: ShieldAlert, color: 'text-orange-400' },
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function AuditLog() {
  const [log, setLog] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${basePath}/api/admin/audit-log?limit=50`)
      if (!res.ok) throw new Error('Failed to load audit log')
      const data = await res.json()
      setLog(data.log)
    } catch (e) {
      setError('Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }, [basePath])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Admin Audit Log</h2>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && log.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-card border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      ) : log.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No admin actions recorded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {log.map((entry) => {
            const config = ACTION_CONFIG[entry.action] || {
              label: entry.action,
              icon: ShieldAlert,
              color: 'text-muted-foreground',
            }
            const Icon = config.icon

            return (
              <div
                key={entry.id}
                className="bg-card border border-border rounded-lg p-4 flex items-start gap-4"
              >
                <div className="mt-0.5">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                    {entry.details && (() => {
                      const d = entry.details as Record<string, string>
                      const target = d.targetEmail ?? d.email
                      return target ? (
                        <span className="text-xs text-muted-foreground">→ {target}</span>
                      ) : null
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by {entry.admin.name || entry.admin.email}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatRelativeTime(entry.createdAt)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
