'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'

interface ColumnComponentProps {
  node: {
    attrs: {
      columns?: number
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
}

const ColumnsComponent = ({ node }: ColumnComponentProps) => {
  const columns = node.attrs.columns || 2

  return (
    <NodeViewWrapper>
      <div
        className="grid gap-4 my-2"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        data-testid="columns-block"
      >
        <NodeViewContent className="column-content" />
      </div>
    </NodeViewWrapper>
  )
}

export const Columns = Node.create({
  name: 'columns',

  group: 'block',

  content: 'column+',

  addAttributes() {
    return {
      columns: {
        default: 2,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="columns"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'columns' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnsComponent)
  },
})

// Column node for individual columns
export const Column = Node.create({
  name: 'column',

  group: 'block',

  content: 'block+',

  parseHTML() {
    return [
      {
        tag: 'div[data-type="column"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column', class: 'border-l border-border pl-4 first:border-l-0 first:pl-0' }), 0]
  },
})
