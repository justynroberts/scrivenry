import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import Link from 'next/link'
import { FileText } from 'lucide-react'

interface PageMentionComponentProps {
  node: {
    attrs: {
      pageId?: string
      pageTitle?: string
      pageIcon?: string
    }
  }
}

const PageMentionComponent = ({ node }: PageMentionComponentProps) => {
  const pageId = node.attrs.pageId || ''
  const pageTitle = node.attrs.pageTitle || 'Untitled'
  const pageIcon = node.attrs.pageIcon

  return (
    <NodeViewWrapper as="span" className="inline">
      <Link
        href={`/page/${pageId}`}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent/50 hover:bg-accent text-sm transition-colors"
        contentEditable={false}
        data-testid={`page-mention-${pageId}`}
      >
        {pageIcon ? (
          <span className="text-sm">{pageIcon}</span>
        ) : (
          <FileText className="h-3.5 w-3.5" />
        )}
        <span>{pageTitle}</span>
      </Link>
    </NodeViewWrapper>
  )
}

export const PageMention = Node.create({
  name: 'pageMention',

  group: 'inline',

  inline: true,

  atom: true,

  addAttributes() {
    return {
      pageId: {
        default: null,
      },
      pageTitle: {
        default: 'Untitled',
      },
      pageIcon: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="page-mention"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'page-mention' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(PageMentionComponent)
  },
})
