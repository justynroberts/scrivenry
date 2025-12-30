'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { X } from 'lucide-react'

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😜', '🤔', '🤗', '🤩', '😎'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '💪', '🤘', '👋', '🖐️', '✋', '👊', '🤜', '🤛', '☝️', '👆', '👇', '👉'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💝', '💘', '💟', '♥️', '😻'],
  'Objects': ['📝', '📚', '📖', '📁', '📂', '📅', '📆', '📌', '📎', '✂️', '🔑', '🔒', '💡', '📧', '📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️'],
  'Symbols': ['✅', '❌', '⭐', '🌟', '💫', '✨', '⚡', '🔥', '💯', '🎯', '⏰', '⏳', '🔔', '🎵', '🎶', '⚠️', '🚫', '💬', '💭', '🏷️'],
  'Nature': ['🌞', '🌙', '⭐', '☁️', '🌧️', '⛈️', '🌈', '🌊', '🌸', '🌺', '🌻', '🌹', '🌷', '🍀', '🌲', '🌴', '🍎', '🍊', '🍋', '🍇'],
}

function EmojiPickerComponent({
  editor,
  node,
  deleteNode
}: {
  editor: any
  node: any
  deleteNode: () => void
}) {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Smileys')

  const insertEmoji = (emoji: string) => {
    const { state, dispatch } = editor.view
    const { from } = state.selection

    // Delete the emoji picker node and insert the emoji
    deleteNode()
    editor.chain().focus().insertContent(emoji).run()
  }

  return (
    <NodeViewWrapper className="inline-block">
      <div className="bg-popover border rounded-lg shadow-lg p-3 w-[320px]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Pick an emoji</span>
          <button
            onClick={deleteNode}
            className="p-1 hover:bg-accent rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as keyof typeof EMOJI_CATEGORIES)}
              className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="grid grid-cols-10 gap-0.5">
          {EMOJI_CATEGORIES[selectedCategory].map((emoji, index) => (
            <button
              key={index}
              onClick={() => insertEmoji(emoji)}
              className="w-7 h-7 flex items-center justify-center hover:bg-accent rounded text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const EmojiPicker = Node.create({
  name: 'emojiPicker',
  group: 'inline',
  inline: true,
  atom: true,

  parseHTML() {
    return [{ tag: 'span[data-emoji-picker]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-emoji-picker': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmojiPickerComponent)
  },
})
