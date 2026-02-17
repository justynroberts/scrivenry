'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, ImageIcon, MoreHorizontal, Star, Keyboard, Sparkles, Trash2, Copy, Focus, X, Globe } from 'lucide-react'
import { Editor } from '@/components/editor/Editor'
import { Button } from '@/components/ui/button'
import { EmojiPicker } from '@/components/EmojiPicker'
import { CoverPicker } from '@/components/CoverPicker'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { AIChat } from '@/components/editor/AIChat'
import { TagPicker } from '@/components/TagPicker'
import { ShareDialog } from '@/components/ShareDialog'
import { usePages } from '@/lib/contexts/PageContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Page, Tag } from '@/lib/db/schema'

interface PageEditorProps {
  page: Page
  breadcrumb: { id: string; title: string }[]
  isFavorite?: boolean
  initialTags?: Tag[]
}

export function PageEditor({ page: initialPage, breadcrumb, isFavorite: initialFavorite = false, initialTags = [] }: PageEditorProps) {
  const router = useRouter()
  const { updatePage: updateSidebarPage, removePage, addPage } = usePages()
  const [page, setPage] = useState(initialPage)
  const [saving, setSaving] = useState(false)
  const [coverOpen, setCoverOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const [zenMode, setZenMode] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [pageTags, setPageTags] = useState<Tag[]>(initialTags)
  const [contentWidth, setContentWidth] = useState<string>('max-w-3xl')
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastLocalEditRef = useRef<number>(0)
  const lastKnownUpdatedAt = useRef<string>(String(initialPage.updatedAt))

  // Load content width from localStorage
  useEffect(() => {
    const widthMap: Record<string, string> = {
      'narrow': 'max-w-2xl',
      'medium': 'max-w-3xl',
      'wide': 'max-w-5xl',
      'full': 'max-w-none',
    }
    const saved = localStorage.getItem('contentWidth')
    if (saved && widthMap[saved]) {
      setContentWidth(widthMap[saved])
    }

    // Listen for changes from settings page
    const handleWidthChange = (e: CustomEvent<string>) => {
      if (widthMap[e.detail]) {
        setContentWidth(widthMap[e.detail])
      }
    }
    window.addEventListener('contentWidthChange', handleWidthChange as EventListener)
    return () => window.removeEventListener('contentWidthChange', handleWidthChange as EventListener)
  }, [])

  // Smart polling for external updates - only when tab is visible
  useEffect(() => {
    let pollTimeout: NodeJS.Timeout | null = null

    const checkForUpdates = async () => {
      // Skip if tab not visible or user edited recently
      if (document.hidden || Date.now() - lastLocalEditRef.current < 2000) {
        pollTimeout = setTimeout(checkForUpdates, 2000)
        return
      }

      try {
        const res = await fetch(`/api/pages/${page.id}`)
        if (!res.ok) return

        const { page: serverPage } = await res.json()

        // Check if server has newer version
        if (serverPage.updatedAt !== lastKnownUpdatedAt.current) {
          lastKnownUpdatedAt.current = serverPage.updatedAt
          setPage(prev => ({
            ...serverPage,
            createdAt: serverPage.createdAt,
            updatedAt: serverPage.updatedAt,
            deletedAt: serverPage.deletedAt,
          }))
          // Update sidebar too
          updateSidebarPage(serverPage.id, {
            title: serverPage.title,
            icon: serverPage.icon,
          })
        }
      } catch {
        // Silently ignore errors
      } finally {
        pollTimeout = setTimeout(checkForUpdates, 2000)
      }
    }

    // Start polling
    pollTimeout = setTimeout(checkForUpdates, 2000)

    return () => {
      if (pollTimeout) clearTimeout(pollTimeout)
    }
  }, [page.id, updateSidebarPage])

  const saveContent = useCallback(async (content: Record<string, unknown>) => {
    setSaving(true)
    lastLocalEditRef.current = Date.now()
    try {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        const { page: updatedPage } = await res.json()
        lastKnownUpdatedAt.current = updatedPage.updatedAt
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }, [page.id])

  const handleContentChange = useCallback((content: Record<string, unknown>) => {
    lastLocalEditRef.current = Date.now()
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveContent(content)
    }, 1000)
  }, [saveContent])

  const handleTitleChange = useCallback(async (e: React.FocusEvent<HTMLHeadingElement>) => {
    const newTitle = e.currentTarget.textContent || 'Untitled'
    if (newTitle !== page.title) {
      setPage(prev => ({ ...prev, title: newTitle }))
      updateSidebarPage(page.id, { title: newTitle })
      lastLocalEditRef.current = Date.now()
      try {
        const res = await fetch(`/api/pages/${page.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle }),
        })
        if (res.ok) {
          const { page: updatedPage } = await res.json()
          lastKnownUpdatedAt.current = updatedPage.updatedAt
        }
      } catch (error) {
        console.error('Failed to save title:', error)
      }
    }
  }, [page.id, page.title, updateSidebarPage])

  const handleIconChange = useCallback(async (emoji: string) => {
    setPage(prev => ({ ...prev, icon: emoji || null }))
    updateSidebarPage(page.id, { icon: emoji || null })
    lastLocalEditRef.current = Date.now()
    try {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icon: emoji || null }),
      })
      if (res.ok) {
        const { page: updatedPage } = await res.json()
        lastKnownUpdatedAt.current = updatedPage.updatedAt
      }
    } catch (error) {
      console.error('Failed to save icon:', error)
    }
  }, [page.id, updateSidebarPage])

  const handleCoverChange = useCallback(async (cover: string | null) => {
    setPage(prev => ({ ...prev, cover }))
    lastLocalEditRef.current = Date.now()
    try {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover }),
      })
      if (res.ok) {
        const { page: updatedPage } = await res.json()
        lastKnownUpdatedAt.current = updatedPage.updatedAt
      }
    } catch (error) {
      console.error('Failed to save cover:', error)
    }
  }, [page.id])

  const toggleFavorite = useCallback(async () => {
    try {
      if (isFavorite) {
        await fetch('/api/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId: page.id }),
        })
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId: page.id }),
        })
      }
      setIsFavorite(!isFavorite)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }, [isFavorite, page.id])

  const handleDelete = useCallback(() => {
    setDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    try {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        removePage(page.id)
        router.push('/')
      }
    } catch (error) {
      console.error('Failed to delete page:', error)
    }
  }, [page.id, removePage, router])

  const handleDuplicate = useCallback(async () => {
    try {
      const res = await fetch(`/api/pages/${page.id}/duplicate`, {
        method: 'POST',
      })
      if (res.ok) {
        const { page: newPage } = await res.json()
        addPage(newPage)
        router.push(`/page/${newPage.id}`)
      }
    } catch (error) {
      console.error('Failed to duplicate page:', error)
    }
  }, [page.id, addPage, router])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setShortcutsOpen(true)
      }
      // Cmd+. or Ctrl+. to toggle zen mode
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault()
        setZenMode(prev => !prev)
      }
      // Escape to exit zen mode
      if (e.key === 'Escape' && zenMode) {
        e.preventDefault()
        setZenMode(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [zenMode])

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        {/* Cover */}
        {page.cover ? (
          <div
            className={`h-48 bg-cover bg-center relative group cursor-pointer ${
              page.cover.startsWith('animated:')
                ? `cover-${page.cover.replace('animated:', '')}`
                : ''
            }`}
            style={
              page.cover.startsWith('animated:')
                ? undefined
                : {
                    background: page.cover.startsWith('linear-gradient') || page.cover.startsWith('#')
                      ? page.cover
                      : `url(${page.cover}) center/cover`,
                  }
            }
            onClick={() => setCoverOpen(true)}
            data-testid="page-cover"
          >
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm">Change cover</span>
            </div>
          </div>
        ) : null}

        <div className={`${contentWidth} mx-auto px-8 py-6 ${page.cover ? '-mt-16 relative z-10' : ''}`}>
          {/* Breadcrumb */}
          {breadcrumb.length > 0 && (
            <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4" data-testid="breadcrumb">
              {breadcrumb.map((item, index) => (
                <span key={item.id} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                  <Link
                    href={`/page/${item.id}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.title}
                  </Link>
                </span>
              ))}
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground">{page.title}</span>
            </nav>
          )}

          {/* Page Header */}
          <div className="flex items-start gap-4 mb-6 group">
            <EmojiPicker onSelect={handleIconChange}>
              <button
                className="text-4xl hover:bg-accent rounded p-1 transition-colors"
                data-testid="page-icon"
              >
                {page.icon || '📄'}
              </button>
            </EmojiPicker>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <EmojiPicker onSelect={handleIconChange}>
                  <Button variant="ghost" size="sm" data-testid="add-icon-btn">
                    Add icon
                  </Button>
                </EmojiPicker>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCoverOpen(true)}
                  data-testid="add-cover-btn"
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  {page.cover ? 'Change cover' : 'Add cover'}
                </Button>
              </div>

              <h1
                contentEditable
                suppressContentEditableWarning
                onBlur={handleTitleChange}
                className="text-4xl font-bold outline-none"
                data-testid="page-title"
              >
                {page.title}
              </h1>

              {/* Tags */}
              <div className="mt-2">
                <TagPicker
                  pageId={page.id}
                  workspaceId={page.workspaceId}
                  pageTags={pageTags}
                  onTagsChange={setPageTags}
                />
              </div>
            </div>

            <div className="flex items-center gap-1" data-tour="page-actions">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFavorite}
                    data-testid="favorite-btn"
                  >
                    <Star
                      className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAiChatOpen(true)}
                    data-testid="ai-chat-btn"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>AI Chat</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShortcutsOpen(true)}
                    data-testid="shortcuts-btn"
                  >
                    <Keyboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Keyboard shortcuts (Cmd+/)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZenMode(true)}
                    data-testid="zen-mode-btn"
                  >
                    <Focus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zen mode (Cmd+.)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShareOpen(true)}
                    data-testid="share-btn"
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share to web</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="page-menu">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShareOpen(true)}>
                    <Globe className="h-4 w-4 mr-2" />
                    Share to web
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleFavorite}>
                    <Star className="h-4 w-4 mr-2" />
                    {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href={`/api/pages/${page.id}/export?format=markdown`} download>
                      Export as Markdown
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={`/api/pages/${page.id}/export?format=html`} download>
                      Export as HTML
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Status indicator */}
          {saving && (
            <div className="fixed bottom-4 right-4 text-sm text-muted-foreground" data-testid="saving-indicator">
              Saving...
            </div>
          )}

          {/* Editor */}
          <div data-tour="editor">
            <Editor
              content={page.content as Record<string, unknown> | undefined}
              onUpdate={handleContentChange}
            />
          </div>
        </div>

        {/* Cover Picker */}
        <CoverPicker
          open={coverOpen}
          onOpenChange={setCoverOpen}
          onSelect={handleCoverChange}
          currentCover={page.cover}
        />

        {/* Keyboard Shortcuts Modal */}
        <KeyboardShortcuts
          open={shortcutsOpen}
          onOpenChange={setShortcutsOpen}
        />

        {/* AI Chat Sidebar */}
        <AIChat
          editor={null}
          pageContent={page.title + '\n\n' + JSON.stringify(page.content)}
          isOpen={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete page"
          description="Are you sure you want to delete this page? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
          onConfirm={confirmDelete}
        />

        {/* Share Dialog */}
        <ShareDialog
          pageId={page.id}
          pageTitle={page.title}
          open={shareOpen}
          onOpenChange={setShareOpen}
        />

        {/* Zen Mode Overlay */}
        {zenMode && (
          <div className="fixed inset-0 z-50 bg-background flex flex-col">
            {/* Exit button */}
            <div className="absolute top-4 right-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZenMode(false)}
                    className="opacity-30 hover:opacity-100 transition-opacity"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exit zen mode (Esc)</TooltipContent>
              </Tooltip>
            </div>

            {/* Centered content */}
            <div className="flex-1 overflow-auto">
              <div className={`${contentWidth} mx-auto px-8 py-16`}>
                {/* Title */}
                <div className="flex items-center gap-3 mb-8">
                  <span className="text-4xl">{page.icon || '📄'}</span>
                  <h1
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={handleTitleChange}
                    className="text-4xl font-bold outline-none flex-1"
                  >
                    {page.title}
                  </h1>
                </div>

                {/* Editor */}
                <Editor
                  content={page.content as Record<string, unknown> | undefined}
                  onUpdate={handleContentChange}
                />
              </div>
            </div>

            {/* Minimal status */}
            {saving && (
              <div className="absolute bottom-4 right-4 text-sm text-muted-foreground opacity-50">
                Saving...
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
