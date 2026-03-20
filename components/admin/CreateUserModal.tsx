'use client'

import { useState } from 'react'
import { X, Eye, EyeOff, Plus, Copy, Check } from 'lucide-react'

interface CreateUserModalProps {
  onClose: () => void
  onCreated: () => void
}

export function CreateUserModal({ onClose, onCreated }: CreateUserModalProps) {
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    isAdmin: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdUser, setCreatedUser] = useState<{
    email: string
    temporaryPassword?: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email) {
      setError('Email is required')
      return
    }

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

      if (!res.ok) {
        setError(data.error || 'Failed to create user')
        return
      }

      setCreatedUser({
        email: data.user.email,
        temporaryPassword: data.temporaryPassword,
      })

      onCreated()
    } catch {
      setError('Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  function copyPassword() {
    if (createdUser?.temporaryPassword) {
      navigator.clipboard.writeText(createdUser.temporaryPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Create User</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdUser ? (
          <div className="p-6 space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-green-400 font-medium text-sm">✓ User created successfully</p>
              <p className="text-muted-foreground text-sm mt-1">{createdUser.email}</p>
            </div>

            {createdUser.temporaryPassword && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 space-y-2">
                <p className="text-yellow-400 text-sm font-medium">Temporary Password</p>
                <p className="text-xs text-muted-foreground">
                  Share this with the user. They should change it on first login.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm font-mono">
                    {createdUser.temporaryPassword}
                  </code>
                  <button
                    onClick={copyPassword}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Jane Doe"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password{' '}
                <span className="text-muted-foreground font-normal">(leave blank to auto-generate)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min 6 characters"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isAdmin"
                checked={form.isAdmin}
                onChange={(e) => setForm((f) => ({ ...f, isAdmin: e.target.checked }))}
                className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary/50"
              />
              <label htmlFor="isAdmin" className="text-sm text-foreground">
                Grant admin access
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-border text-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create User
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
