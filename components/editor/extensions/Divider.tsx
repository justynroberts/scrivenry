'use client'

import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'

const DividerComponent = () => {
  return (
    <NodeViewWrapper>
      <div
        className="my-6 flex items-center"
        contentEditable={false}
        data-testid="divider-block"
      >
        <hr className="flex-1 border-t border-border" />
      </div>
    </NodeViewWrapper>
  )
}

export const Divider = Node.create({
  name: 'divider',

  group: 'block',

  atom: true,

  parseHTML() {
    return [
      {
        tag: 'hr',
      },
      {
        tag: 'div[data-type="divider"]',
      },
    ]
  },

  renderHTML() {
    return ['hr']
  },

  addNodeView() {
    return ReactNodeViewRenderer(DividerComponent)
  },
})
