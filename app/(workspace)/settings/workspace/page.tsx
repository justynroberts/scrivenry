'use client'

import { useState, useEffect } from 'react'
import { Building2, Download, Loader2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Workspace {
  id: string
  name: string
  createdAt: string
}

export default function WorkspaceSettingsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchWorkspace()
  }, [])

  async function fetchWorkspace() {
    try {
      const response = await fetch('/api/workspace')
      if (response.ok) {
        const data = await response.json()
        setWorkspace(data)
        setName(data.name)
      }
    } catch (err) {
      console.error('Failed to fetch workspace:', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveWorkspace() {
    if (!name.trim()) {
      setError('Workspace name is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setWorkspace(data)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        // Reload to update sidebar
        window.location.reload()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save')
      }
    } catch (err) {
      setError('Failed to save workspace')
    } finally {
      setSaving(false)
    }
  }

  async function exportWorkspace() {
    setExporting(true)

    try {
      const response = await fetch('/api/workspace/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `workspace-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        setError('Failed to export workspace')
      }
    } catch (err) {
      setError('Failed to export workspace')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Workspace Settings</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Manage your workspace name and export your data
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Workspace Name */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Workspace Name</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter workspace name"
            className="flex-1 px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={saveWorkspace} disabled={saving || !name.trim()}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Saved!
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This name appears in the sidebar and exports
        </p>
      </div>

      {/* Export */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Export Workspace</h2>
        <div className="p-6 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground mb-4">
            Download all your pages and content as a JSON file. This backup includes:
          </p>
          <ul className="text-sm text-muted-foreground mb-4 list-disc list-inside space-y-1">
            <li>All pages with their content</li>
            <li>Page hierarchy and structure</li>
            <li>Icons and cover images (URLs)</li>
            <li>Timestamps and metadata</li>
          </ul>
          <Button onClick={exportWorkspace} disabled={exporting} variant="outline">
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export All Data
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Workspace Info */}
      {workspace && (
        <div className="p-6 rounded-lg border bg-muted/30">
          <h3 className="font-medium mb-3">Workspace Information</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Workspace ID</dt>
              <dd className="font-mono">{workspace.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{new Date(workspace.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
