import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'

const ToggleComponent = () => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <NodeViewWrapper className="toggle-block">
      <div className="flex items-start gap-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mt-1 p-0.5 rounded hover:bg-accent transition-colors"
          contentEditable={false}
          data-testid="toggle-button"
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <div className="flex-1">
          <NodeViewContent className="toggle-content" />
        </div>
      </div>
      {!isOpen && (
        <div className="ml-6 mt-1 text-sm text-muted-foreground" contentEditable={false}>
          Click to expand...
        </div>
      )}
    </NodeViewWrapper>
  )
}

export const Toggle = Node.create({
  name: 'toggle',

  group: 'block',

  content: 'block+',

  parseHTML() {
    return [
      {
        tag: 'div[data-type="toggle"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toggle' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleComponent)
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-9': () => this.editor.commands.toggleWrap('toggle'),
    }
  },
})
