'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { Database, Plus, X, Trash2, Maximize2, Minimize2, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Row {
  id: string
  cells: Record<string, string>
}

interface Column {
  id: string
  name: string
  type: 'text' | 'number' | 'checkbox' | 'select'
}

type BlockWidth = 'normal' | 'wide' | 'full'

interface SimpleDatabaseComponentProps {
  node: {
    attrs: {
      columns?: Column[]
      rows?: Row[]
      title?: string
      width?: BlockWidth
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  deleteNode: () => void
}

const generateId = () => Math.random().toString(36).substr(2, 9)

const SimpleDatabaseComponent = ({ node, updateAttributes, deleteNode }: SimpleDatabaseComponentProps) => {
  const defaultColumns: Column[] = [
    { id: 'col1', name: 'Name', type: 'text' },
    { id: 'col2', name: 'Status', type: 'text' },
    { id: 'col3', name: 'Notes', type: 'text' },
  ]
  const defaultRows: Row[] = [
    { id: 'row1', cells: { col1: '', col2: '', col3: '' } },
  ]

  const columns = node.attrs.columns || defaultColumns
  const rows = node.attrs.rows || defaultRows
  const title = node.attrs.title || 'Database'
  const width = node.attrs.width || 'normal'

  const [editingTitle, setEditingTitle] = useState(false)

  const cycleWidth = () => {
    const widths: BlockWidth[] = ['normal', 'wide', 'full']
    const currentIndex = widths.indexOf(width)
    const nextIndex = (currentIndex + 1) % widths.length
    updateAttributes({ width: widths[nextIndex] })
  }

  const getWidthIcon = () => {
    switch (width) {
      case 'wide': return <Maximize2 className="h-4 w-4" />
      case 'full': return <Square className="h-4 w-4" />
      default: return <Minimize2 className="h-4 w-4" />
    }
  }

  const getWidthClasses = () => {
    switch (width) {
      case 'wide': return 'block-width-wide'
      case 'full': return 'block-width-full'
      default: return ''
    }
  }

  const updateCell = (rowId: string, colId: string, value: string) => {
    const newRows = rows.map(row =>
      row.id === rowId
        ? { ...row, cells: { ...row.cells, [colId]: value } }
        : row
    )
    updateAttributes({ rows: newRows })
  }

  const addRow = () => {
    const newRow: Row = {
      id: generateId(),
      cells: columns.reduce((acc, col) => ({ ...acc, [col.id]: '' }), {}),
    }
    updateAttributes({ rows: [...rows, newRow] })
  }

  const deleteRow = (rowId: string) => {
    updateAttributes({ rows: rows.filter(row => row.id !== rowId) })
  }

  const addColumn = () => {
    const newCol: Column = {
      id: generateId(),
      name: `Column ${columns.length + 1}`,
      type: 'text',
    }
    const newRows = rows.map(row => ({
      ...row,
      cells: { ...row.cells, [newCol.id]: '' },
    }))
    updateAttributes({ columns: [...columns, newCol], rows: newRows })
  }

  const updateColumnName = (colId: string, name: string) => {
    const newColumns = columns.map(col =>
      col.id === colId ? { ...col, name } : col
    )
    updateAttributes({ columns: newColumns })
  }

  const deleteColumn = (colId: string) => {
    if (columns.length <= 1) return
    const newColumns = columns.filter(col => col.id !== colId)
    const newRows = rows.map(row => {
      const newCells = { ...row.cells }
      delete newCells[colId]
      return { ...row, cells: newCells }
    })
    updateAttributes({ columns: newColumns, rows: newRows })
  }

  return (
    <NodeViewWrapper>
      <div
        className={`my-4 rounded-lg border border-border overflow-hidden ${getWidthClasses()}`}
        contentEditable={false}
        data-testid="database-block"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
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
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={cycleWidth}
              title={`Width: ${width}`}
              className="px-2"
            >
              {getWidthIcon()}
            </Button>
            <Button size="sm" variant="ghost" onClick={addColumn}>
              <Plus className="h-3 w-3 mr-1" />
              Column
            </Button>
            <Button size="sm" variant="ghost" onClick={deleteNode}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                {columns.map((col, index) => (
                  <th
                    key={col.id}
                    className="px-4 py-2 text-left text-sm font-medium border-r last:border-r-0 group"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={col.name}
                        onChange={(e) => updateColumnName(col.id, e.target.value)}
                        className="bg-transparent flex-1 min-w-0 focus:outline-none"
                      />
                      {columns.length > 1 && (
                        <button
                          onClick={() => deleteColumn(col.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="group border-t hover:bg-muted/30">
                  {columns.map((col) => (
                    <td key={col.id} className="px-4 py-2 border-r last:border-r-0">
                      <input
                        type="text"
                        value={row.cells[col.id] || ''}
                        onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                        className="w-full bg-transparent focus:outline-none text-sm"
                        placeholder="Empty"
                      />
                    </td>
                  ))}
                  <td className="px-2">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Row */}
        <button
          onClick={addRow}
          className="w-full px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 flex items-center gap-2"
        >
          <Plus className="h-3 w-3" />
          New row
        </button>
      </div>
    </NodeViewWrapper>
  )
}

export const SimpleDatabase = Node.create({
  name: 'simpleDatabase',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      columns: {
        default: null,
        parseHTML: element => JSON.parse(element.getAttribute('data-columns') || 'null'),
        renderHTML: attributes => ({ 'data-columns': JSON.stringify(attributes.columns) }),
      },
      rows: {
        default: null,
        parseHTML: element => JSON.parse(element.getAttribute('data-rows') || 'null'),
        renderHTML: attributes => ({ 'data-rows': JSON.stringify(attributes.rows) }),
      },
      title: {
        default: 'Database',
      },
      width: {
        default: 'normal',
        parseHTML: element => element.getAttribute('data-width') || 'normal',
        renderHTML: attributes => ({ 'data-width': attributes.width }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="simple-database"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'simple-database' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(SimpleDatabaseComponent)
  },
})
