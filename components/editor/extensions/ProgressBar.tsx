'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { BarChart3, X } from 'lucide-react'

interface ProgressBarComponentProps {
  node: {
    attrs: {
      value?: number
      max?: number
      label?: string
      color?: string
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  deleteNode: () => void
}

const colors = [
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Yellow', value: 'bg-yellow-500' },
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Pink', value: 'bg-pink-500' },
]

const ProgressBarComponent = ({ node, updateAttributes, deleteNode }: ProgressBarComponentProps) => {
  const { value = 0, max = 100, label = '', color = 'bg-blue-500' } = node.attrs
  const [isEditing, setIsEditing] = useState(false)
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  if (isEditing) {
    return (
      <NodeViewWrapper>
        <div
          className="p-4 rounded-lg border border-border my-2 bg-card"
          contentEditable={false}
          data-testid="progress-editor"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Progress Bar</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => updateAttributes({ label: e.target.value })}
                placeholder="Progress label..."
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Value</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => updateAttributes({ value: parseInt(e.target.value) || 0 })}
                  min={0}
                  max={max}
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Max</label>
                <input
                  type="number"
                  value={max}
                  onChange={(e) => updateAttributes({ max: parseInt(e.target.value) || 100 })}
                  min={1}
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Color</label>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => updateAttributes({ color: c.value })}
                    className={`w-6 h-6 rounded-full ${c.value} ${
                      color === c.value ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <div
        className="group relative my-3 p-3 rounded-lg hover:bg-accent/20 transition-colors cursor-pointer"
        contentEditable={false}
        onClick={() => setIsEditing(true)}
        data-testid="progress-block"
      >
        {label && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-sm text-muted-foreground">{value}/{max} ({Math.round(percentage)}%)</span>
          </div>
        )}
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {!label && (
          <div className="text-right mt-1">
            <span className="text-xs text-muted-foreground">{Math.round(percentage)}%</span>
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            deleteNode()
          }}
          className="absolute top-1 right-1 p-1 rounded-md bg-background border opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </NodeViewWrapper>
  )
}

export const ProgressBar = Node.create({
  name: 'progressBar',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      value: {
        default: 0,
      },
      max: {
        default: 100,
      },
      label: {
        default: '',
      },
      color: {
        default: 'bg-blue-500',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="progress-bar"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'progress-bar' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProgressBarComponent)
  },
})
