'use client'

import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/core'
import { FileText, Clock, Hash } from 'lucide-react'

interface WordCountProps {
  editor: Editor | null
}

interface Stats {
  characters: number
  words: number
  sentences: number
  paragraphs: number
  readingTime: number
}

export function WordCount({ editor }: WordCountProps) {
  const [stats, setStats] = useState<Stats>({
    characters: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    readingTime: 0,
  })
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (!editor) return

    const updateStats = () => {
      const text = editor.getText()
      const characters = text.length
      const words = text.split(/\s+/).filter((word) => word.length > 0).length
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
      const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0).length
      const readingTime = Math.ceil(words / 200) // Average reading speed: 200 wpm

      setStats({ characters, words, sentences, paragraphs, readingTime })
    }

    updateStats()
    editor.on('update', updateStats)

    return () => {
      editor.off('update', updateStats)
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg shadow-lg hover:bg-accent/50 transition-colors"
      >
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {stats.words} words
        </span>
        <span className="text-xs text-muted-foreground/60">
          ~{stats.readingTime} min read
        </span>
      </button>

      {isExpanded && (
        <div className="absolute bottom-full right-0 mb-2 p-4 bg-card border border-border rounded-lg shadow-xl min-w-[200px]">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Document Statistics
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Characters</span>
              <span className="font-mono">{stats.characters.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Words</span>
              <span className="font-mono">{stats.words.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sentences</span>
              <span className="font-mono">{stats.sentences.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paragraphs</span>
              <span className="font-mono">{stats.paragraphs.toLocaleString()}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2 flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Reading time
              </span>
              <span className="font-mono">{stats.readingTime} min</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
