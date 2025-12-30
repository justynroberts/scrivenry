'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ProfileFormProps {
  user: {
    id: string
    email: string
    name: string | null
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (res.ok) {
        setMessage('Profile updated successfully')
      } else {
        setMessage('Failed to update profile')
      }
    } catch {
      setMessage('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <Input value={user.email} disabled className="bg-muted" />
        <p className="text-sm text-muted-foreground mt-1">
          Email cannot be changed
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      {message && (
        <p className={`text-sm ${message.includes('success') ? 'text-green-500' : 'text-destructive'}`}>
          {message}
        </p>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save changes'}
      </Button>
    </form>
  )
}
