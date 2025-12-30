'use client'

import { createContext, useContext, useCallback, useState, type ReactNode } from 'react'
import type { Page } from '@/lib/db/schema'

interface PageContextType {
  pages: Page[]
  updatePage: (pageId: string, updates: Partial<Page>) => void
  addPage: (page: Page) => void
  removePage: (pageId: string) => void
  setPages: (pages: Page[]) => void
}

const PageContext = createContext<PageContextType | null>(null)

interface PageProviderProps {
  children: ReactNode
  initialPages: Page[]
}

export function PageProvider({ children, initialPages }: PageProviderProps) {
  const [pages, setPagesState] = useState<Page[]>(initialPages)

  const updatePage = useCallback((pageId: string, updates: Partial<Page>) => {
    setPagesState(prev =>
      prev.map(p => p.id === pageId ? { ...p, ...updates } : p)
    )
  }, [])

  const addPage = useCallback((page: Page) => {
    setPagesState(prev => [...prev, page])
  }, [])

  const removePage = useCallback((pageId: string) => {
    setPagesState(prev => prev.filter(p => p.id !== pageId))
  }, [])

  const setPages = useCallback((newPages: Page[]) => {
    setPagesState(newPages)
  }, [])

  return (
    <PageContext.Provider value={{ pages, updatePage, addPage, removePage, setPages }}>
      {children}
    </PageContext.Provider>
  )
}

export function usePages() {
  const context = useContext(PageContext)
  if (!context) {
    throw new Error('usePages must be used within a PageProvider')
  }
  return context
}
