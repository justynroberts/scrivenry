'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Trash2,
  Key,
  Shield,
  ShieldOff,
  MoreVertical,
  Search,
  RefreshCw,
  UserX,
  UserCheck,
  Check,
  Copy,
  X,
} from 'lucide-react'
import { CreateUserModal } from './CreateUserModal'

interface AdminUser {
  id: string
  email: string
  name: string | null
  avatar: string | null
  isAdmin: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastActiveAt: string | null
  pageCount: number
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface UserActionsMenuProps {
  user: AdminUser
  currentUserId: string
  onAction: (action: string, userId: string, extra?: Record<string, unknown>) => void
}

function UserActionsMenu({ user, currentUserId, onAction }: UserActionsMenuProps) {
  const [open, setOpen] = useState(false)

  const isSelf = user.id === currentUserId

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-popover border border-border rounded-lg shadow-xl w-48 py-1 text-sm">
            <button
              onClick={() => { onAction('resetPassword', user.id); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 text-foreground transition-colors"
            >
              <Key className="w-3.5 h-3.5 text-yellow-400" />
              Reset Password
            </button>

            {!isSelf && (
              <>
                <button
                  onClick={() => { onAction('toggleAdmin', user.id, { isAdmin: !user.isAdmin }); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 text-foreground transition-colors"
                >
                  {user.isAdmin ? (
                    <>
                      <ShieldOff className="w-3.5 h-3.5 text-orange-400" />
                      Revoke Admin
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      Grant Admin
                    </>
                  )}
                </button>

                <button
                  onClick={() => { onAction('toggleActive', user.id, { isActive: !user.isActive }); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 text-foreground transition-colors"
                >
                  {user.isActive ? (
                    <>
                      <UserX className="w-3.5 h-3.5 text-orange-400" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-green-400" />
                      Activate
                    </>
                  )}
                </button>

                <div className="border-t border-border my-1" />

                <button
                  onClick={() => { onAction('delete', user.id); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-500/10 text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete User
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

interface ResetPasswordModalProps {
  userId: string
  userEmail: string
  onClose: () => void
}

function ResetPasswordModal({ userId, userEmail, onClose }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ tempPassword?: string } | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  async function handleReset() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${basePath}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetPassword: true, newPassword: newPassword || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to reset password')
        return
      }
      setResult({ tempPassword: data.temporaryPassword })
    } catch {
      setError('Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  function copyPassword() {
    if (result?.tempPassword) {
      navigator.clipboard.writeText(result.tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Reset Password</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Resetting password for <span className="text-foreground font-medium">{userEmail}</span>
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {result ? (
            <>
              {result.tempPassword ? (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 space-y-2">
                  <p className="text-yellow-400 text-sm font-medium">New Temporary Password</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm font-mono">
                      {result.tempPassword}
                    </code>
                    <button onClick={copyPassword} className="p-2 text-muted-foreground hover:text-foreground">
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm">
                  ✓ Password reset successfully
                </div>
              )}
              <button
                onClick={onClose}
                className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  New Password <span className="text-muted-foreground font-normal">(leave blank to auto-generate)</span>
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to auto-generate"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface ConfirmDeleteModalProps {
  user: AdminUser
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

function ConfirmDeleteModal({ user, onConfirm, onCancel, loading }: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Delete User?</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          This will permanently delete the user and all their data. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface UserManagerProps {
  currentUserId: string
}

export function UserManager({ currentUserId }: UserManagerProps) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [resetPasswordFor, setResetPasswordFor] = useState<AdminUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${basePath}/api/admin/users`)
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data.users)
    } catch {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [basePath])

  useEffect(() => {
    load()
  }, [load])

  async function handleAction(action: string, userId: string, extra?: Record<string, unknown>) {
    if (action === 'delete') {
      const user = users.find((u) => u.id === userId)
      if (user) setDeleteTarget(user)
      return
    }

    if (action === 'resetPassword') {
      const user = users.find((u) => u.id === userId)
      if (user) setResetPasswordFor(user)
      return
    }

    if (action === 'toggleAdmin' || action === 'toggleActive') {
      setActionLoading(userId)
      try {
        const body: Record<string, unknown> = {}
        if (action === 'toggleAdmin') body.isAdmin = extra?.isAdmin
        if (action === 'toggleActive') body.isActive = extra?.isActive

        const res = await fetch(`${basePath}/api/admin/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Action failed')
          return
        }

        await load()
      } catch {
        setError('Action failed')
      } finally {
        setActionLoading(null)
      }
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`${basePath}/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Delete failed')
        return
      }
      setDeleteTarget(null)
      await load()
    } catch {
      setError('Delete failed')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                  Pages
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                  Joined
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-8 bg-muted/30 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {search ? 'No users match your search' : 'No users found'}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-muted/20 transition-colors ${
                      actionLoading === u.id ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">
                          {(u.name || u.email)[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {u.name || u.email}
                          </p>
                          {u.name && (
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          )}
                        </div>
                        {u.isAdmin && (
                          <Shield className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          u.isActive
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                      {u.pageCount}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <UserActionsMenu
                        user={u}
                        currentUserId={currentUserId}
                        onAction={handleAction}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
        </p>
      </div>

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            load()
          }}
        />
      )}

      {resetPasswordFor && (
        <ResetPasswordModal
          userId={resetPasswordFor.id}
          userEmail={resetPasswordFor.email}
          onClose={() => {
            setResetPasswordFor(null)
            load()
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          user={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </>
  )
}
