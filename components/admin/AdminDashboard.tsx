'use client'

import { useState, useEffect, useCallback } from 'react'
import { LayoutDashboard, Users, ScrollText, UserPlus, ShieldCheck } from 'lucide-react'
import { StatsCards } from './StatsCards'
import { UserManager } from './UserManager'
import { AuditLog } from './AuditLog'
import { CreateUserModal } from './CreateUserModal'

type Tab = 'dashboard' | 'users' | 'create' | 'audit'

interface Stats {
  totalUsers: number
  totalPages: number
  totalWorkspaces: number
  activeWorkspaces: number
  storageUsed: string
  recentUsers: Array<{
    id: string
    email: string
    name: string | null
    createdAt: string
    isAdmin: boolean
  }>
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'create', label: 'Create User', icon: UserPlus },
  { id: 'audit', label: 'Audit Log', icon: ScrollText },
]

interface AdminDashboardProps {
  userId: string
  userEmail: string
}

export function AdminDashboard({ userId, userEmail }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await fetch(`${basePath}/api/admin/stats`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } finally {
      setStatsLoading(false)
    }
  }, [basePath])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-foreground">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Scrivenry</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Signed in as <span className="text-foreground font-medium">{userEmail}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="border-b border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-0 -mb-px overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-1">Overview</h2>
              <p className="text-sm text-muted-foreground">System statistics and recent activity</p>
            </div>

            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />
                ))}
              </div>
            ) : stats ? (
              <StatsCards stats={stats} />
            ) : null}

            {stats && stats.recentUsers.length > 0 && (
              <div>
                <h3 className="text-base font-semibold mb-4">Recent Signups</h3>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">User</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Email</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Joined</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stats.recentUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">
                                {(u.name || u.email)[0].toUpperCase()}
                              </div>
                              <span className="font-medium truncate">{u.name || u.email.split('@')[0]}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{u.email}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              u.isAdmin ? 'bg-purple-500/10 text-purple-400' : 'bg-muted text-muted-foreground'
                            }`}>
                              {u.isAdmin ? 'Admin' : 'User'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && <UserManager currentUserId={userId} />}

        {activeTab === 'create' && (
          <div className="max-w-md">
            <h2 className="text-xl font-semibold mb-1">Create User</h2>
            <p className="text-sm text-muted-foreground mb-6">Add a new user to the system</p>
            <div className="bg-card border border-border rounded-xl p-6">
              <CreateUserInline basePath={basePath} onCreated={() => {
                setActiveTab('users')
                loadStats()
              }} />
            </div>
          </div>
        )}

        {activeTab === 'audit' && <AuditLog />}
      </div>

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            loadStats()
          }}
        />
      )}
    </div>
  )
}

// Inline version of create user form (no modal)
function CreateUserInline({ basePath, onCreated }: { basePath: string; onCreated: () => void }) {
  const [form, setForm] = useState({ email: '', name: '', password: '', isAdmin: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ email: string; temporaryPassword?: string } | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email) { setError('Email is required'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${basePath}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          name: form.name || undefined,
          password: form.password || undefined,
          isAdmin: form.isAdmin,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create user'); return }
      setResult({ email: data.user.email, temporaryPassword: data.temporaryPassword })
      onCreated()
    } catch { setError('Failed to create user') }
    finally { setLoading(false) }
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-green-400 font-medium">✓ User created: {result.email}</p>
        </div>
        {result.temporaryPassword && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-yellow-400 text-sm font-medium mb-2">Temporary Password</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm font-mono">
                {result.temporaryPassword}
              </code>
              <button onClick={() => {
                navigator.clipboard.writeText(result.temporaryPassword!)
                setCopied(true); setTimeout(() => setCopied(false), 2000)
              }} className="p-2 text-muted-foreground hover:text-foreground">
                {copied ? '✓' : '⎘'}
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setResult(null)}
          className="w-full border border-border rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          Create Another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium mb-1.5">Email *</label>
        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="user@example.com" required
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Display Name</label>
        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Jane Doe"
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Password <span className="text-muted-foreground font-normal">(blank = auto-generate)</span></label>
        <input type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          placeholder="Min 6 characters"
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
      </div>
      <div className="flex items-center gap-2.5">
        <input type="checkbox" id="adminInline" checked={form.isAdmin} onChange={e => setForm(f => ({ ...f, isAdmin: e.target.checked }))}
          className="w-4 h-4 rounded" />
        <label htmlFor="adminInline" className="text-sm">Grant admin access</label>
      </div>
      <button type="submit" disabled={loading}
        className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
        {loading ? 'Creating…' : 'Create User'}
      </button>
    </form>
  )
}
