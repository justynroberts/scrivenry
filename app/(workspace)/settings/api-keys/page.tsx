'use client'

import { useState, useEffect } from 'react'
import { Key, Plus, Trash2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface ApiKey {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchKeys()
  }, [])

  async function fetchKeys() {
    try {
      const res = await fetch('/api/api-keys')
      if (res.ok) {
        const data = await res.json()
        setKeys(data.keys)
      }
    } catch (error) {
      console.error('Failed to fetch keys:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createKey() {
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      })

      if (res.ok) {
        const data = await res.json()
        setNewKey(data.key)
        setKeys(prev => [...prev, data.apiKey])
        setNewKeyName('')
      }
    } catch (error) {
      console.error('Failed to create key:', error)
    }
  }

  async function deleteKey(id: string) {
    if (!confirm('Are you sure you want to delete this API key?')) return

    try {
      const res = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setKeys(prev => prev.filter(k => k.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete key:', error)
    }
  }

  function copyKey() {
    if (newKey) {
      navigator.clipboard.writeText(newKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleCloseCreate() {
    setCreateOpen(false)
    setNewKey(null)
    setNewKeyName('')
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Manage API keys for programmatic access
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Key
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium mb-2">No API keys yet</h2>
          <p className="text-muted-foreground mb-4">
            Create an API key to access Scrivenry programmatically
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first key
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map(key => (
            <div
              key={key.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">{key.name}</h3>
                <p className="text-sm text-muted-foreground">
                  <code className="bg-muted px-1 rounded">{key.prefix}...</code>
                  {' - '}
                  Created {new Date(key.createdAt).toLocaleDateString()}
                  {key.lastUsedAt && (
                    <> - Last used {new Date(key.lastUsedAt).toLocaleDateString()}</>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteKey(key.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={handleCloseCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newKey ? 'API Key Created' : 'Create API Key'}
            </DialogTitle>
          </DialogHeader>

          {newKey ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Copy your API key now. You will not be able to see it again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-muted rounded-lg text-sm break-all">
                  {newKey}
                </code>
                <Button variant="outline" size="icon" onClick={copyKey}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={handleCloseCreate}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Key Name
                </label>
                <Input
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseCreate}>
                  Cancel
                </Button>
                <Button onClick={createKey} disabled={!newKeyName.trim()}>
                  Create Key
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
