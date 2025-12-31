'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { SearchDialog } from '@/components/SearchDialog'
import { WelcomeTour } from '@/components/WelcomeTour'
import { PageProvider, usePages } from '@/lib/contexts/PageContext'
import type { Page } from '@/lib/db/schema'

interface WorkspaceLayoutProps {
  children: React.ReactNode
  pages: Page[]
  workspaceName: string
  workspaceId: string
}

function WorkspaceContent({
  children,
  workspaceName,
  workspaceId,
}: Omit<WorkspaceLayoutProps, 'pages'>) {
  const router = useRouter()
  const { pages, addPage, removePage } = usePages()
  const [searchOpen, setSearchOpen] = useState(false)
  const [favorites, setFavorites] = useState<Page[]>([])
  const [showTour, setShowTour] = useState(false)

  // Check if tour should be shown (from database)
  useEffect(() => {
    async function checkTourStatus() {
      try {
        const res = await fetch('/api/user/tour')
        if (res.ok) {
          const data = await res.json()
          if (!data.hasSeenTour) {
            // Delay tour start to let page render
            setTimeout(() => setShowTour(true), 1000)
          }
        }
      } catch (error) {
        console.error('Failed to check tour status:', error)
      }
    }
    checkTourStatus()
  }, [])

  // Fetch favorites
  useEffect(() => {
    async function loadFavorites() {
      try {
        const res = await fetch('/api/favorites')
        if (res.ok) {
          const data = await res.json()
          setFavorites(data.favorites || [])
        }
      } catch (error) {
        console.error('Failed to load favorites:', error)
      }
    }
    loadFavorites()
  }, [])

  const handleCreatePage = useCallback(async (parentId?: string) => {
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          parentId: parentId || null,
          title: 'Untitled',
        }),
      })

      if (res.ok) {
        const { page } = await res.json()
        addPage(page)
        router.push(`/page/${page.id}`)
      }
    } catch (error) {
      console.error('Failed to create page:', error)
    }
  }, [workspaceId, router, addPage])

  const handleDeletePage = useCallback(async (pageId: string) => {
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        removePage(pageId)
        router.push('/')
      }
    } catch (error) {
      console.error('Failed to delete page:', error)
    }
  }, [router, removePage])

  const handleDuplicatePage = useCallback(async (pageId: string) => {
    try {
      const res = await fetch(`/api/pages/${pageId}/duplicate`, {
        method: 'POST',
      })

      if (res.ok) {
        const { page } = await res.json()
        addPage(page)
        router.push(`/page/${page.id}`)
      }
    } catch (error) {
      console.error('Failed to duplicate page:', error)
    }
  }, [router, addPage])

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen">
      <Sidebar
        pages={pages}
        favorites={favorites}
        workspaceName={workspaceName}
        onCreatePage={handleCreatePage}
        onDeletePage={handleDeletePage}
        onDuplicatePage={handleDuplicatePage}
        onSearch={() => setSearchOpen(true)}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        pages={pages}
        workspaceId={workspaceId}
      />
      {showTour && (
        <WelcomeTour onComplete={() => setShowTour(false)} />
      )}
    </div>
  )
}

export function WorkspaceLayout({
  children,
  pages,
  workspaceName,
  workspaceId,
}: WorkspaceLayoutProps) {
  return (
    <PageProvider initialPages={pages}>
      <WorkspaceContent
        workspaceName={workspaceName}
        workspaceId={workspaceId}
      >
        {children}
      </WorkspaceContent>
    </PageProvider>
  )
}
