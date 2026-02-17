// MIT License - Copyright (c) fintonlabs.com

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Globe, Copy, Check, Loader2, Link2Off, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ShareDialogProps {
  pageId: string
  pageTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ShareData {
  id: string
  pageId: string
  allowEditing: boolean
  expiresAt: string | null
  createdAt: string
}

export function ShareDialog({ pageId, pageTitle, open, onOpenChange }: ShareDialogProps) {
  const [share, setShare] = useState<ShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Fetch current share status
  const fetchShare = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pages/${pageId}/share`)
      if (res.ok) {
        const data = await res.json()
        setShare(data.share || null)
      }
    } catch (error) {
      console.error('Failed to fetch share:', error)
    } finally {
      setLoading(false)
    }
  }, [pageId])

  useEffect(() => {
    if (open) {
      fetchShare()
    }
  }, [open, fetchShare])

  const createShare = async () => {
    setCreating(true)
    try {
      const res = await fetch(`/api/pages/${pageId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowEditing: false }),
      })
      if (res.ok) {
        const data = await res.json()
        setShare(data.share)
      }
    } catch (error) {
      console.error('Failed to create share:', error)
    } finally {
      setCreating(false)
    }
  }

  const removeShare = async () => {
    setRemoving(true)
    try {
      const res = await fetch(`/api/pages/${pageId}/share`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setShare(null)
      }
    } catch (error) {
      console.error('Failed to remove share:', error)
    } finally {
      setRemoving(false)
    }
  }

  const copyLink = async () => {
    if (!share) return
    const url = `${window.location.origin}/share/${share.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareUrl = share ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${share.id}` : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Share to web
          </DialogTitle>
          <DialogDescription>
            Share "{pageTitle}" with anyone via a public link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : share ? (
            <>
              {/* Share is active */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium">Published to web</p>
                  <p className="text-sm text-muted-foreground">Anyone with the link can view</p>
                </div>
              </div>

              {/* Link input */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-md px-3 py-2 text-sm truncate font-mono">
                  {shareUrl}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => window.open(shareUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {/* Remove share button */}
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={removeShare}
                disabled={removing}
              >
                {removing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Link2Off className="h-4 w-4 mr-2" />
                )}
                Stop sharing
              </Button>
            </>
          ) : (
            <>
              {/* No share yet */}
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Globe className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">This page is private</p>
                  <p className="text-sm text-muted-foreground">
                    Publish to share with anyone who has the link
                  </p>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={createShare}
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4 mr-2" />
                )}
                Publish to web
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
