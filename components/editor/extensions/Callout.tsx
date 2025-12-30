import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { useState } from 'react'

const CALLOUT_TYPES = {
  info: { icon: 'information-circle', bg: 'bg-blue-500/10', border: 'border-blue-500/30', defaultEmoji: 'information' },
  warning: { icon: 'exclamation-triangle', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', defaultEmoji: 'warning' },
  success: { icon: 'check-circle', bg: 'bg-green-500/10', border: 'border-green-500/30', defaultEmoji: 'white_check_mark' },
  error: { icon: 'x-circle', bg: 'bg-red-500/10', border: 'border-red-500/30', defaultEmoji: 'x' },
  note: { icon: 'document-text', bg: 'bg-gray-500/10', border: 'border-gray-500/30', defaultEmoji: 'memo' },
}

const CALLOUT_EMOJIS = ['💡', '⚠️', '✅', '❌', '📝', '🔥', '💭', '📌', '🎯', '💪', '🚀', '⭐']

interface CalloutComponentProps {
  node: {
    attrs: {
      emoji?: string
      type?: string
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
}

const CalloutComponent = ({ node, updateAttributes }: CalloutComponentProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emoji = node.attrs.emoji || '💡'

  return (
    <NodeViewWrapper>
      <div
        className="flex gap-3 p-4 rounded-lg bg-accent/50 border border-border my-2"
        data-testid="callout-block"
      >
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-xl hover:bg-accent rounded p-1 transition-colors"
            contentEditable={false}
            data-testid="callout-emoji"
          >
            {emoji}
          </button>
          {showEmojiPicker && (
            <div
              className="absolute top-full left-0 mt-1 p-2 bg-popover rounded-lg border shadow-lg z-10 grid grid-cols-6 gap-1"
              contentEditable={false}
            >
              {CALLOUT_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    updateAttributes({ emoji: e })
                    setShowEmojiPicker(false)
                  }}
                  className="text-lg hover:bg-accent rounded p-1"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
        <NodeViewContent className="flex-1 min-w-0" />
      </div>
    </NodeViewWrapper>
  )
}

export const Callout = Node.create({
  name: 'callout',

  group: 'block',

  content: 'block+',

  addAttributes() {
    return {
      emoji: {
        default: '💡',
      },
      type: {
        default: 'info',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout', class: 'callout-block' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent)
  },
})
