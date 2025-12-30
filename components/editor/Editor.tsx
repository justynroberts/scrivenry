'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { SlashCommand } from './SlashCommand'
import { EditorBubbleMenu } from './BubbleMenu'
import { Toggle } from './extensions/Toggle'
import { Callout } from './extensions/Callout'
import { PageMention } from './extensions/PageMention'
import { TableOfContents } from './extensions/TableOfContents'
import { ImageBlock } from './extensions/ImageBlock'
import { Bookmark } from './extensions/Bookmark'
import { Divider } from './extensions/Divider'
import { VideoEmbed } from './extensions/VideoEmbed'
import { FileBlock } from './extensions/FileBlock'
import { MathBlock } from './extensions/MathBlock'
import { ProgressBar } from './extensions/ProgressBar'
import { SimpleDatabase } from './extensions/SimpleDatabase'
import { KanbanBoard } from './extensions/KanbanBoard'
import { CalendarBlock } from './extensions/CalendarBlock'
import { QuoteBlock } from './extensions/QuoteBlock'
import { Columns, Column } from './extensions/Columns'
import { AIBlock } from './extensions/AIBlock'
import { EmojiPicker } from './extensions/EmojiPicker'
import { JavaScriptBlock } from './extensions/JavaScriptBlock'
import { PythonBlock } from './extensions/PythonBlock'
import { MermaidBlock } from './extensions/MermaidBlock'
import { ChartBlock } from './extensions/ChartBlock'
import { TimelineBlock } from './extensions/TimelineBlock'
import { RatingBlock } from './extensions/RatingBlock'
import { AIWritingAssistant } from './AIWritingAssistant'
import { WordCount } from './WordCount'
import { useCallback, useEffect } from 'react'

const lowlight = createLowlight(common)

interface EditorProps {
  content?: Record<string, unknown>
  onUpdate?: (content: Record<string, unknown>) => void
  editable?: boolean
}

export function Editor({ content, onUpdate, editable = true }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Heading'
          }
          return "Type '/' for commands..."
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'typescript',
      }),
      Toggle,
      Callout,
      PageMention,
      TableOfContents,
      ImageBlock,
      Bookmark,
      Divider,
      VideoEmbed,
      FileBlock,
      MathBlock,
      ProgressBar,
      SimpleDatabase,
      KanbanBoard,
      CalendarBlock,
      QuoteBlock,
      Columns,
      Column,
      AIBlock,
      EmojiPicker,
      JavaScriptBlock,
      PythonBlock,
      MermaidBlock,
      ChartBlock,
      TimelineBlock,
      RatingBlock,
      SlashCommand,
    ],
    content: content || {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-2',
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getJSON())
    },
  })

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      // Trigger save
      if (editor) {
        onUpdate?.(editor.getJSON())
      }
    }
  }, [editor, onUpdate])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (editor && content) {
      const currentContent = JSON.stringify(editor.getJSON())
      const newContent = JSON.stringify(content)
      if (currentContent !== newContent) {
        editor.commands.setContent(content)
      }
    }
  }, [editor, content])

  if (!editor) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
      </div>
    )
  }

  return (
    <div className="relative">
      <EditorBubbleMenu editor={editor} />
      <EditorContent editor={editor} />
      <AIWritingAssistant editor={editor} />
      <WordCount editor={editor} />
    </div>
  )
}
