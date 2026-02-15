// MIT License - Copyright (c) fintonlabs.com
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
  GripVertical,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  type CollisionDetection,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  onReorderPages?: (pageIds: string[]) => void
  onMovePage?: (pageId: string, newParentId: string | null) => void
  onSearch?: () => void
}

interface PageItemProps {
  page: Page
  pages: Page[]
  depth?: number
  onDelete?: (pageId: string) => void
  onDuplicate?: (pageId: string) => void
  onCreateSubpage?: (parentId: string) => void
  isOverlay?: boolean
  isDropTarget?: boolean
}

interface SortablePageItemProps extends Omit<PageItemProps, 'isOverlay'> {
  id: string
}

function SortablePageItem({ id, ...props }: SortablePageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `drop-${id}`,
    data: { pageId: id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  // Combine refs for both sortable and droppable on the same element
  const setRefs = (node: HTMLDivElement | null) => {
    setNodeRef(node)
    setDropRef(node)
  }

  return (
    <div ref={setRefs} style={style}>
      <PageItem
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDropTarget={isOver && !isDragging}
      />
    </div>
  )
}

interface PageItemInternalProps extends PageItemProps {
  dragHandleProps?: Record<string, unknown>
}

function PageItem({
  page,
  pages,
  depth = 0,
  onDelete,
  onDuplicate,
  onCreateSubpage,
  dragHandleProps,
  isOverlay = false,
  isDropTarget = false,
}: PageItemInternalProps) {
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

  if (isOverlay) {
    return (
      <div className="bg-card border rounded-md shadow-lg p-2 flex items-center gap-2 opacity-95">
        <span className="text-sm">{page.icon || '📄'}</span>
        <span className="text-sm">{page.title || 'Untitled'}</span>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0">
      <div
        className={cn(
          'group flex items-center gap-0.5 py-1 px-1 rounded-md hover:bg-accent/50 transition-all min-w-0',
          isActive && 'bg-accent',
          isDropTarget && 'bg-primary/20 ring-2 ring-primary ring-inset'
        )}
        style={{ marginLeft: `${depth * 12}px` }}
      >
        {/* Drag handle */}
        {dragHandleProps && (
          <button
            className="p-0.5 rounded hover:bg-accent flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            {...dragHandleProps}
          >
            <GripVertical className="h-3 w-3" />
          </button>
        )}

        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 rounded hover:bg-accent flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        <Link
          href={`/page/${page.id}`}
          className="flex-1 flex items-center gap-1 min-w-0"
        >
          <span className="text-xs flex-shrink-0">{page.icon || '📄'}</span>
          <span className="text-xs truncate">{page.title || 'Untitled'}</span>
        </Link>

        <div className="flex items-center flex-shrink-0">
          <button
            onClick={(e) => handleCreateSubpage(e)}
            className="p-0.5 rounded hover:bg-accent text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            title="Add subpage"
            data-testid={`add-subpage-${page.id}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-0.5 rounded hover:bg-accent text-muted-foreground/40 hover:text-muted-foreground transition-colors" title="More options">
                <MoreHorizontal className="h-3.5 w-3.5" />
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
      </div>

      {isExpanded && (
        <div>
          {children.map(child => (
            <SortablePageItem
              key={child.id}
              id={child.id}
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
              style={{ marginLeft: `${(depth + 1) * 12 + 16}px` }}
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
  onReorderPages,
  onMovePage,
  onSearch,
}: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const rootPages = pages
    .filter(p => !p.parentId && !p.deletedAt)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  const activePage = activeId ? pages.find(p => p.id === activeId) : null

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  // Custom collision detection: prioritize drop targets over sortable items
  const customCollisionDetection: CollisionDetection = (args) => {
    // First check for drop targets (nesting)
    const pointerCollisions = pointerWithin(args)
    const dropTargetCollision = pointerCollisions.find(
      (collision) => String(collision.id).startsWith('drop-')
    )

    if (dropTargetCollision) {
      return [dropTargetCollision]
    }

    // Fall back to closest center for reordering
    return closestCenter(args)
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id as string | undefined
    if (overId?.startsWith('drop-')) {
      setOverId(overId.replace('drop-', ''))
    } else {
      setOverId(null)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)

    if (!over) return

    const activePageId = active.id as string
    const overId = over.id as string

    // Check if dropping onto a page (to make it a subpage)
    if (overId.startsWith('drop-')) {
      const targetPageId = overId.replace('drop-', '')
      if (targetPageId !== activePageId) {
        // Move page to become child of target
        onMovePage?.(activePageId, targetPageId)
      }
      return
    }

    // Otherwise it's a reorder within root pages
    if (active.id !== over.id) {
      const oldIndex = rootPages.findIndex(p => p.id === active.id)
      const newIndex = rootPages.findIndex(p => p.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(rootPages, oldIndex, newIndex)
        const pageIds = newOrder.map(p => p.id)
        onReorderPages?.(pageIds)
      }
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="w-72 h-screen flex flex-col bg-card border-r" data-tour="sidebar">
      {/* Workspace Header */}
      <div className="p-3 pt-8 border-b">
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
            <DndContext
              sensors={sensors}
              collisionDetection={customCollisionDetection}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pages.filter(p => !p.deletedAt).map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-0.5 pb-4 px-2 overflow-hidden">
                  {rootPages.map(page => (
                    <SortablePageItem
                      key={page.id}
                      id={page.id}
                      page={page}
                      pages={pages}
                      onDelete={onDeletePage}
                      onDuplicate={onDuplicatePage}
                      onCreateSubpage={(parentId) => onCreatePage?.(parentId)}
                      isDropTarget={overId === page.id && activeId !== page.id}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activePage ? (
                  <PageItem
                    page={activePage}
                    pages={pages}
                    isOverlay
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
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
