'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { Clock, Plus, Trash2, GripVertical } from 'lucide-react'

interface TimelineItem {
  id: string
  date: string
  title: string
  description: string
  color: string
}

interface TimelineBlockProps {
  node: {
    attrs: {
      items: TimelineItem[]
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
}

const colors = [
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
]

function TimelineBlockComponent({ node, updateAttributes }: TimelineBlockProps) {
  const [items, setItems] = useState<TimelineItem[]>(
    node.attrs.items?.length > 0
      ? node.attrs.items
      : [
          {
            id: '1',
            date: 'Jan 2024',
            title: 'Project Started',
            description: 'Initial planning and setup',
            color: '#8b5cf6',
          },
          {
            id: '2',
            date: 'Feb 2024',
            title: 'Development Phase',
            description: 'Core features implemented',
            color: '#3b82f6',
          },
          {
            id: '3',
            date: 'Mar 2024',
            title: 'Launch',
            description: 'Public release',
            color: '#22c55e',
          },
        ]
  )

  const updateItems = (newItems: TimelineItem[]) => {
    setItems(newItems)
    updateAttributes({ items: newItems })
  }

  const addItem = () => {
    const newItem: TimelineItem = {
      id: Date.now().toString(),
      date: 'Date',
      title: 'New Event',
      description: 'Description',
      color: colors[items.length % colors.length].value,
    }
    updateItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    updateItems(items.filter((item) => item.id !== id))
  }

  const updateItem = (id: string, field: keyof TimelineItem, value: string) => {
    updateItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  return (
    <NodeViewWrapper className="my-4">
      <div className="border border-indigo-500/30 rounded-lg overflow-hidden bg-indigo-950/20">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-indigo-900/30 border-b border-indigo-500/30">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-300">Timeline</span>
          </div>
          <button
            onClick={addItem}
            className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
          >
            <Plus className="h-3 w-3" />
            Add Event
          </button>
        </div>

        {/* Timeline */}
        <div className="p-4">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-indigo-500/30" />

            {/* Items */}
            <div className="space-y-6">
              {items.map((item, index) => (
                <div key={item.id} className="relative flex gap-4 group">
                  {/* Dot */}
                  <div
                    className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  >
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.date}
                          onChange={(e) => updateItem(item.id, 'date', e.target.value)}
                          className="text-xs text-indigo-400 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 -ml-1"
                          placeholder="Date"
                        />
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                          className="block text-sm font-medium text-white bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 -ml-1 w-full"
                          placeholder="Title"
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="block text-sm text-gray-400 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 -ml-1 w-full resize-none"
                          placeholder="Description"
                          rows={1}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <select
                          value={item.color}
                          onChange={(e) => updateItem(item.id, 'color', e.target.value)}
                          className="text-xs bg-indigo-900/50 border border-indigo-500/30 rounded px-1 py-0.5 text-indigo-300"
                        >
                          {colors.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 rounded hover:bg-red-900/50 text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const TimelineBlock = Node.create({
  name: 'timelineBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      items: { default: [] },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="timeline-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'timeline-block' })]
  },

  addNodeView() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ReactNodeViewRenderer(TimelineBlockComponent as any)
  },
})
