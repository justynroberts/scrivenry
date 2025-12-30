import { Extension } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion'
import tippy, { Instance } from 'tippy.js'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Code2,
  Quote,
  Minus,
  Table,
  ChevronRight,
  Lightbulb,
  Image,
  Link2,
  ListTree,
  Video,
  FileIcon,
  Calculator,
  BarChart3,
  Database,
  Kanban,
  Calendar,
  Columns,
  MessageSquareQuote,
  Sparkles,
  Smile,
  AtSign,
  GitBranch,
  PieChart,
  Clock,
  Star,
} from 'lucide-react'
import type { Editor } from '@tiptap/core'

interface CommandItem {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  command: (editor: Editor) => void
}

const commands: CommandItem[] = [
  {
    title: 'AI Generate',
    description: 'Generate content with AI',
    icon: Sparkles,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'aiBlock',
    }).run(),
  },
  {
    title: 'Text',
    description: 'Plain text paragraph',
    icon: Type,
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    description: 'Create a bullet list',
    icon: List,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    description: 'Create a numbered list',
    icon: ListOrdered,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Todo List',
    description: 'Track tasks with a to-do list',
    icon: CheckSquare,
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: 'Code Block',
    description: 'Display code with syntax highlighting',
    icon: Code,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'JavaScript',
    description: 'Write and run JavaScript code',
    icon: Code2,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'javascriptBlock',
    }).run(),
  },
  {
    title: 'Python',
    description: 'Write and run Python code',
    icon: Code2,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'pythonBlock',
    }).run(),
  },
  {
    title: 'Quote',
    description: 'Capture a quote',
    icon: Quote,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Divider',
    description: 'Visual divider',
    icon: Minus,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: 'Table',
    description: 'Add a table',
    icon: Table,
    command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: 'Toggle',
    description: 'Collapsible toggle block',
    icon: ChevronRight,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'toggle',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Toggle content' }] }]
    }).run(),
  },
  {
    title: 'Callout',
    description: 'Highlighted callout box',
    icon: Lightbulb,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'callout',
      attrs: { emoji: '💡' },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Callout text' }] }]
    }).run(),
  },
  {
    title: 'Image',
    description: 'Add an image',
    icon: Image,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'imageBlock',
    }).run(),
  },
  {
    title: 'Bookmark',
    description: 'Add a web bookmark',
    icon: Link2,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'bookmark',
    }).run(),
  },
  {
    title: 'Table of Contents',
    description: 'Auto-generated TOC',
    icon: ListTree,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'tableOfContents',
    }).run(),
  },
    {
    title: 'Video',
    description: 'Embed YouTube, Vimeo, Loom',
    icon: Video,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'videoEmbed',
    }).run(),
  },
  {
    title: 'File',
    description: 'Attach a file',
    icon: FileIcon,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'fileBlock',
    }).run(),
  },
  {
    title: 'Math Equation',
    description: 'LaTeX math expression',
    icon: Calculator,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'mathBlock',
    }).run(),
  },
  {
    title: 'Progress Bar',
    description: 'Visual progress indicator',
    icon: BarChart3,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'progressBar',
    }).run(),
  },
  {
    title: 'Database',
    description: 'Simple table database',
    icon: Database,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'simpleDatabase',
    }).run(),
  },
  {
    title: 'Kanban Board',
    description: 'Task board with columns',
    icon: Kanban,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'kanbanBoard',
    }).run(),
  },
  {
    title: 'Calendar',
    description: 'Calendar with events',
    icon: Calendar,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'calendarBlock',
    }).run(),
  },
  {
    title: 'Quote Block',
    description: 'Styled quote with author',
    icon: MessageSquareQuote,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'quoteBlock',
    }).run(),
  },
  {
    title: 'Columns',
    description: 'Multi-column layout',
    icon: Columns,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'columns',
      content: [
        { type: 'column', content: [{ type: 'paragraph' }] },
        { type: 'column', content: [{ type: 'paragraph' }] },
      ],
    }).run(),
  },
  {
    title: 'Emoji',
    description: 'Insert an emoji',
    icon: Smile,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'emojiPicker',
    }).run(),
  },
  {
    title: 'Page Link',
    description: 'Link to another page',
    icon: AtSign,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'pageMention',
    }).run(),
  },
  {
    title: 'Mermaid Diagram',
    description: 'Flowcharts, sequences, and more',
    icon: GitBranch,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'mermaidBlock',
    }).run(),
  },
  {
    title: 'Chart',
    description: 'Bar, line, pie charts',
    icon: PieChart,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'chartBlock',
    }).run(),
  },
  {
    title: 'Timeline',
    description: 'Chronological events',
    icon: Clock,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'timelineBlock',
    }).run(),
  },
  {
    title: 'Rating',
    description: 'Star rating system',
    icon: Star,
    command: (editor) => editor.chain().focus().insertContent({
      type: 'ratingBlock',
    }).run(),
  },
]

interface CommandListProps {
  items: CommandItem[]
  command: (item: CommandItem) => void
}

interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
      const item = items[index]
      if (item) {
        command(item)
      }
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }
        return false
      },
    }))

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    if (items.length === 0) {
      return (
        <div className="bg-popover rounded-lg border shadow-lg p-2">
          <p className="text-sm text-muted-foreground">No results</p>
        </div>
      )
    }

    return (
      <div className="bg-popover rounded-lg border shadow-lg overflow-hidden max-h-80 overflow-y-auto">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={item.title}
              onClick={() => selectItem(index)}
              className={`flex items-center gap-3 w-full px-3 py-2 text-left text-sm ${
                index === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    )
  }
)

CommandList.displayName = 'CommandList'

const suggestion: Omit<SuggestionOptions<CommandItem>, 'editor'> = {
  items: ({ query }) => {
    return commands.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    )
  },
  render: () => {
    let component: ReactRenderer<CommandListRef> | null = null
    let popup: Instance[] | null = null

    return {
      onStart: (props) => {
        component = new ReactRenderer(CommandList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) {
          return
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
      },
      onUpdate: (props) => {
        component?.updateProps(props)

        if (!props.clientRect) {
          return
        }

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        })
      },
      onKeyDown: (props) => {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide()
          return true
        }
        return component?.ref?.onKeyDown(props) ?? false
      },
      onExit: () => {
        popup?.[0]?.destroy()
        component?.destroy()
      },
    }
  },
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: { editor: Editor; range: { from: number; to: number }; props: CommandItem }) => {
          props.command(editor)
          editor.chain().focus().deleteRange(range).run()
        },
        ...suggestion,
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
