'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { Page } from '@/lib/db/schema'

interface TrashListProps {
  pages: Page[]
}

export function TrashList({ pages: initialPages }: TrashListProps) {
  const router = useRouter()
  const [pages, setPages] = useState(initialPages)
  const [emptyDialogOpen, setEmptyDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pageToDelete, setPageToDelete] = useState<string | null>(null)

  async function handleRestore(pageId: string) {
    try {
      const res = await fetch(`/api/pages/${pageId}/restore`, {
        method: 'POST',
      })

      if (res.ok) {
        setPages(prev => prev.filter(p => p.id !== pageId))
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to restore page:', error)
    }
  }

  function confirmDelete(pageId: string) {
    setPageToDelete(pageId)
    setDeleteDialogOpen(true)
  }

  async function handleDelete() {
    if (!pageToDelete) return

    try {
      const res = await fetch(`/api/pages/${pageToDelete}?permanent=true`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setPages(prev => prev.filter(p => p.id !== pageToDelete))
      }
    } catch (error) {
      console.error('Failed to delete page:', error)
    } finally {
      setDeleteDialogOpen(false)
      setPageToDelete(null)
    }
  }

  async function handleEmptyTrash() {
    try {
      const deletePromises = pages.map(page =>
        fetch(`/api/pages/${page.id}?permanent=true`, {
          method: 'DELETE',
        })
      )

      await Promise.all(deletePromises)
      setPages([])
      router.refresh()
    } catch (error) {
      console.error('Failed to empty trash:', error)
    } finally {
      setEmptyDialogOpen(false)
    }
  }

  if (pages.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg" data-testid="trash-empty">
        <Trash2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium mb-2">Trash is empty</h2>
        <p className="text-muted-foreground">
          Deleted pages will appear here
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setEmptyDialogOpen(true)}
          data-testid="empty-trash"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Empty Trash ({pages.length})
        </Button>
      </div>
      <div className="space-y-2" data-testid="trash-list">
        {pages.map(page => (
        <div
          key={page.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          data-testid={`trash-item-${page.id}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{page.icon || '📄'}</span>
            <div>
              <p className="font-medium">{page.title}</p>
              <p className="text-sm text-muted-foreground">
                Deleted {page.deletedAt ? new Date(page.deletedAt).toLocaleDateString() : 'recently'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRestore(page.id)}
              data-testid={`restore-${page.id}`}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Restore
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => confirmDelete(page.id)}
              className="text-destructive hover:text-destructive"
              data-testid={`delete-${page.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete permanently?"
        description="This page will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />

      <ConfirmDialog
        open={emptyDialogOpen}
        onOpenChange={setEmptyDialogOpen}
        title="Empty trash?"
        description={`This will permanently delete ${pages.length} page${pages.length > 1 ? 's' : ''}. This action cannot be undone.`}
        confirmLabel="Empty Trash"
        onConfirm={handleEmptyTrash}
        variant="destructive"
      />
    </>
  )
}
