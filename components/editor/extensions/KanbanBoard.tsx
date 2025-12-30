'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { Kanban, Plus, X, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Card {
  id: string
  title: string
}

interface Column {
  id: string
  title: string
  cards: Card[]
}

interface KanbanBoardComponentProps {
  node: {
    attrs: {
      columns?: Column[]
      title?: string
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  deleteNode: () => void
}

const generateId = () => Math.random().toString(36).substr(2, 9)

const KanbanBoardComponent = ({ node, updateAttributes, deleteNode }: KanbanBoardComponentProps) => {
  const defaultColumns: Column[] = [
    { id: 'todo', title: 'To Do', cards: [] },
    { id: 'progress', title: 'In Progress', cards: [] },
    { id: 'done', title: 'Done', cards: [] },
  ]

  const columns = node.attrs.columns || defaultColumns
  const title = node.attrs.title || 'Kanban Board'

  const [editingTitle, setEditingTitle] = useState(false)
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [newCardColumn, setNewCardColumn] = useState<string | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [draggedCard, setDraggedCard] = useState<{ columnId: string; cardId: string } | null>(null)

  const addCard = (columnId: string) => {
    if (!newCardTitle.trim()) return
    const newColumns = columns.map(col => {
      if (col.id === columnId) {
        return {
          ...col,
          cards: [...col.cards, { id: generateId(), title: newCardTitle.trim() }],
        }
      }
      return col
    })
    updateAttributes({ columns: newColumns })
    setNewCardTitle('')
    setNewCardColumn(null)
  }

  const deleteCard = (columnId: string, cardId: string) => {
    const newColumns = columns.map(col => {
      if (col.id === columnId) {
        return {
          ...col,
          cards: col.cards.filter(card => card.id !== cardId),
        }
      }
      return col
    })
    updateAttributes({ columns: newColumns })
  }

  const addColumn = () => {
    const newColumn: Column = {
      id: generateId(),
      title: 'New Column',
      cards: [],
    }
    updateAttributes({ columns: [...columns, newColumn] })
  }

  const deleteColumn = (columnId: string) => {
    if (columns.length <= 1) return
    updateAttributes({ columns: columns.filter(col => col.id !== columnId) })
  }

  const updateColumnTitle = (columnId: string, newTitle: string) => {
    const newColumns = columns.map(col =>
      col.id === columnId ? { ...col, title: newTitle } : col
    )
    updateAttributes({ columns: newColumns })
  }

  const moveCard = (fromColumnId: string, cardId: string, toColumnId: string) => {
    const fromColumn = columns.find(col => col.id === fromColumnId)
    const card = fromColumn?.cards.find(c => c.id === cardId)
    if (!card) return

    const newColumns = columns.map(col => {
      if (col.id === fromColumnId) {
        return { ...col, cards: col.cards.filter(c => c.id !== cardId) }
      }
      if (col.id === toColumnId) {
        return { ...col, cards: [...col.cards, card] }
      }
      return col
    })
    updateAttributes({ columns: newColumns })
  }

  const handleDragStart = (columnId: string, cardId: string) => {
    setDraggedCard({ columnId, cardId })
  }

  const handleDrop = (toColumnId: string) => {
    if (draggedCard && draggedCard.columnId !== toColumnId) {
      moveCard(draggedCard.columnId, draggedCard.cardId, toColumnId)
    }
    setDraggedCard(null)
  }

  return (
    <NodeViewWrapper>
      <div
        className="my-4 rounded-lg border border-border overflow-hidden"
        contentEditable={false}
        data-testid="kanban-block"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b">
          <div className="flex items-center gap-2">
            <Kanban className="h-4 w-4 text-muted-foreground" />
            {editingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => updateAttributes({ title: e.target.value })}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                className="px-2 py-1 text-sm font-medium bg-background border rounded"
                autoFocus
              />
            ) : (
              <span
                className="font-medium cursor-pointer hover:text-primary"
                onClick={() => setEditingTitle(true)}
              >
                {title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={addColumn}>
              <Plus className="h-3 w-3 mr-1" />
              Column
            </Button>
            <Button size="sm" variant="ghost" onClick={deleteNode}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Board */}
        <div className="flex gap-4 p-4 overflow-x-auto min-h-[300px] bg-muted/30">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-64 bg-card rounded-lg border flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b">
                {editingColumnId === column.id ? (
                  <input
                    type="text"
                    value={column.title}
                    onChange={(e) => updateColumnTitle(column.id, e.target.value)}
                    onBlur={() => setEditingColumnId(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingColumnId(null)}
                    className="px-2 py-1 text-sm font-medium bg-background border rounded flex-1"
                    autoFocus
                  />
                ) : (
                  <span
                    className="font-medium text-sm cursor-pointer"
                    onClick={() => setEditingColumnId(column.id)}
                  >
                    {column.title}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 rounded">
                    {column.cards.length}
                  </span>
                  {columns.length > 1 && (
                    <button
                      onClick={() => deleteColumn(column.id)}
                      className="p-1 hover:text-destructive rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[400px]">
                {column.cards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => handleDragStart(column.id, card.id)}
                    className="group p-3 bg-background rounded border hover:border-primary/50 cursor-move flex items-start gap-2"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="flex-1 text-sm">{card.title}</span>
                    <button
                      onClick={() => deleteCard(column.id, card.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Add Card Input */}
                {newCardColumn === column.id ? (
                  <div className="p-2 bg-background rounded border">
                    <input
                      type="text"
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCard(column.id)}
                      placeholder="Card title..."
                      className="w-full text-sm bg-transparent focus:outline-none"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => addCard(column.id)}>Add</Button>
                      <Button size="sm" variant="ghost" onClick={() => setNewCardColumn(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setNewCardColumn(column.id)}
                    className="w-full p-2 text-sm text-muted-foreground hover:bg-muted rounded flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add card
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const KanbanBoard = Node.create({
  name: 'kanbanBoard',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      columns: {
        default: null,
        parseHTML: element => JSON.parse(element.getAttribute('data-columns') || 'null'),
        renderHTML: attributes => ({ 'data-columns': JSON.stringify(attributes.columns) }),
      },
      title: {
        default: 'Kanban Board',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="kanban-board"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'kanban-board' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(KanbanBoardComponent)
  },
})
