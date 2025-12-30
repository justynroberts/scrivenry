'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

const SHORTCUTS = [
  { category: 'Navigation', shortcuts: [
    { keys: ['Cmd', 'K'], description: 'Quick search' },
    { keys: ['Cmd', 'N'], description: 'New page' },
    { keys: ['Cmd', '\\'], description: 'Toggle sidebar' },
  ]},
  { category: 'Text Formatting', shortcuts: [
    { keys: ['Cmd', 'B'], description: 'Bold' },
    { keys: ['Cmd', 'I'], description: 'Italic' },
    { keys: ['Cmd', 'U'], description: 'Underline' },
    { keys: ['Cmd', 'Shift', 'S'], description: 'Strikethrough' },
    { keys: ['Cmd', 'E'], description: 'Inline code' },
  ]},
  { category: 'Blocks', shortcuts: [
    { keys: ['/'], description: 'Open block menu' },
    { keys: ['#'], description: 'Heading 1' },
    { keys: ['##'], description: 'Heading 2' },
    { keys: ['###'], description: 'Heading 3' },
    { keys: ['-'], description: 'Bullet list' },
    { keys: ['1.'], description: 'Numbered list' },
    { keys: ['[]'], description: 'Todo list' },
    { keys: ['>'], description: 'Quote' },
    { keys: ['```'], description: 'Code block' },
  ]},
  { category: 'Editing', shortcuts: [
    { keys: ['Cmd', 'Z'], description: 'Undo' },
    { keys: ['Cmd', 'Shift', 'Z'], description: 'Redo' },
    { keys: ['Cmd', 'S'], description: 'Save' },
    { keys: ['Tab'], description: 'Indent' },
    { keys: ['Shift', 'Tab'], description: 'Outdent' },
  ]},
]

interface KeyboardShortcutsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcuts({ open, onOpenChange }: KeyboardShortcutsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="keyboard-shortcuts">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96">
          <div className="space-y-6">
            {SHORTCUTS.map((section) => (
              <div key={section.category}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.shortcuts.map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, j) => (
                          <kbd
                            key={j}
                            className="px-2 py-1 text-xs font-mono bg-muted rounded border"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
