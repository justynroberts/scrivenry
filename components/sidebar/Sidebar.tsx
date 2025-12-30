'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  FileText,
  Plus,
  Search,
  Settings,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Trash2,
  Copy,
  LogOut,
  Star,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Page } from '@/lib/db/schema'

interface SidebarProps {
  pages: Page[]
  favorites?: Page[]
  workspaceName?: string
  onCreatePage?: (parentId?: string) => void
  onDeletePage?: (pageId: string) => void
  onDuplicatePage?: (pageId: string) => void
  onSearch?: () => void
}

interface PageItemProps {
  page: Page
  pages: Page[]
  depth?: number
  onDelete?: (pageId: string) => void
  onDuplicate?: (pageId: string) => void
  onCreateSubpage?: (parentId: string) => void
}

function PageItem({ page, pages, depth = 0, onDelete, onDuplicate, onCreateSubpage }: PageItemProps) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  const isActive = pathname === `/page/${page.id}`

  const children = pages.filter(p => p.parentId === page.id && !p.deletedAt)
  const hasChildren = children.length > 0

  const handleCreateSubpage = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onCreateSubpage?.(page.id)
    setIsExpanded(true)
  }

  return (
    <div className="w-full overflow-hidden">
      <div
        className={cn(
          'group flex items-center gap-1 py-1 rounded-md hover:bg-accent/50 transition-colors',
          isActive && 'bg-accent'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px`, paddingRight: '8px' }}
      >
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 rounded hover:bg-accent flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        <Link
          href={`/page/${page.id}`}
          className="flex-1 flex items-center gap-2 min-w-0"
        >
          <span className="text-base">{page.icon || '📄'}</span>
          <span className="text-sm truncate">{page.title || 'Untitled'}</span>
        </Link>

        <button
          onClick={(e) => handleCreateSubpage(e)}
          className="p-1 rounded hover:bg-accent transition-opacity flex-shrink-0"
          title="Add subpage"
          data-testid={`add-subpage-${page.id}`}
        >
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded hover:bg-accent transition-opacity flex-shrink-0">
              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => handleCreateSubpage(e)}>
              <Plus className="h-4 w-4 mr-2" />
              Add subpage
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate?.(page.id)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(page.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && (
        <div>
          {children.map(child => (
            <PageItem
              key={child.id}
              page={child}
              pages={pages}
              depth={depth + 1}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onCreateSubpage={onCreateSubpage}
            />
          ))}
          {children.length === 0 && (
            <div
              className="text-xs text-muted-foreground py-1"
              style={{ paddingLeft: `${(depth + 1) * 12 + 24}px` }}
            >
              No subpages
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function Sidebar({
  pages,
  favorites = [],
  workspaceName = 'My Workspace',
  onCreatePage,
  onDeletePage,
  onDuplicatePage,
  onSearch,
}: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const rootPages = pages.filter(p => !p.parentId && !p.deletedAt)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="w-64 h-screen flex flex-col bg-card border-r" data-tour="sidebar">
      {/* Workspace Header */}
      <div className="p-3 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent transition-colors">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-primary text-primary-foreground text-xs font-medium">
                {workspaceName[0]}
              </div>
              <span className="flex-1 text-left text-sm font-medium truncate">
                {workspaceName}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Actions */}
      <div className="p-2 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          size="sm"
          onClick={onSearch}
          data-testid="sidebar-search"
          data-tour="search"
        >
          <Search className="h-4 w-4" />
          Search
          <span className="ml-auto text-xs text-muted-foreground">Cmd+K</span>
        </Button>
      </div>

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div className="px-2 pb-2" data-testid="favorites-section">
          <div className="flex items-center px-2 py-1">
            <Star className="h-3.5 w-3.5 text-yellow-500 mr-2" />
            <span className="text-xs font-medium text-muted-foreground">Favorites</span>
          </div>
          <div className="space-y-0.5">
            {favorites.map(page => (
              <Link
                key={page.id}
                href={`/page/${page.id}`}
                className={cn(
                  'flex items-center gap-2 px-3 py-1 rounded-md text-sm hover:bg-accent/50 transition-colors',
                  pathname === `/page/${page.id}` && 'bg-accent'
                )}
                data-testid={`favorite-${page.id}`}
              >
                <span className="text-base">{page.icon || '📄'}</span>
                <span className="truncate">{page.title || 'Untitled'}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pages */}
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">Pages</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => onCreatePage?.()}
            data-testid="sidebar-create-page"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 w-full">
          {rootPages.length === 0 ? (
            <div className="px-4 py-4 text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No pages yet</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => onCreatePage?.()}
              >
                <Plus className="h-4 w-4 mr-1" />
                New page
              </Button>
            </div>
          ) : (
            <div className="space-y-0.5 pb-4 px-2">
              {rootPages.map(page => (
                <PageItem
                  key={page.id}
                  page={page}
                  pages={pages}
                  onDelete={onDeletePage}
                  onDuplicate={onDuplicatePage}
                  onCreateSubpage={(parentId) => onCreatePage?.(parentId)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Trash Link */}
      <div className="p-2 border-t">
        <Link
          href="/trash"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent/50 transition-colors',
            pathname === '/trash' && 'bg-accent'
          )}
          data-testid="sidebar-trash"
          data-tour="trash"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
          <span>Trash</span>
        </Link>
      </div>
    </div>
  )
}
