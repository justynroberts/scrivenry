'use client'

import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import { List } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Heading {
  level: number
  text: string
  id: string
}

interface TableOfContentsComponentProps {
  editor?: Editor | null
}

const TableOfContentsComponent = ({ editor }: TableOfContentsComponentProps) => {
  const [headings, setHeadings] = useState<Heading[]>([])

  useEffect(() => {
    if (!editor) return

    const updateHeadings = () => {
      const newHeadings: Heading[] = []
      const doc = editor.state.doc

      doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const id = `heading-${pos}`
          newHeadings.push({
            level: node.attrs.level,
            text: node.textContent,
            id,
          })
        }
      })

      setHeadings(newHeadings)
    }

    updateHeadings()

    editor.on('update', updateHeadings)

    return () => {
      editor.off('update', updateHeadings)
    }
  }, [editor])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (headings.length === 0) {
    return (
      <NodeViewWrapper>
        <div
          className="flex items-center gap-2 p-4 rounded-lg bg-accent/30 border border-border my-2 text-muted-foreground"
          contentEditable={false}
          data-testid="toc-block"
        >
          <List className="h-4 w-4" />
          <span className="text-sm">Add headings to see table of contents</span>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <div
        className="p-4 rounded-lg bg-accent/30 border border-border my-2"
        contentEditable={false}
        data-testid="toc-block"
      >
        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
          <List className="h-4 w-4" />
          <span className="text-sm font-medium">Table of Contents</span>
        </div>
        <nav className="space-y-1">
          {headings.map((heading, index) => (
            <button
              key={index}
              onClick={() => scrollToHeading(heading.id)}
              className="block w-full text-left text-sm hover:text-primary transition-colors"
              style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
            >
              {heading.text || 'Untitled'}
            </button>
          ))}
        </nav>
      </div>
    </NodeViewWrapper>
  )
}

export const TableOfContents = Node.create({
  name: 'tableOfContents',

  group: 'block',

  atom: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="table-of-contents"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, 'data-type': 'table-of-contents' }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(TableOfContentsComponent)
  },
})
