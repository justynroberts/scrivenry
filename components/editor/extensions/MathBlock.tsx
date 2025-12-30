'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { Calculator, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MathBlockComponentProps {
  node: {
    attrs: {
      expression?: string | null
      displayMode?: boolean
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  deleteNode: () => void
}

// Simple LaTeX-like rendering (basic support)
function renderMath(expr: string): string {
  if (!expr) return ''

  let result = expr
    // Fractions: \frac{a}{b} -> a/b
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    // Superscript: x^2 or x^{2}
    .replace(/\^(\d+)/g, '<sup>$1</sup>')
    .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
    // Subscript: x_2 or x_{2}
    .replace(/_(\d+)/g, '<sub>$1</sub>')
    .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
    // Square root: \sqrt{x}
    .replace(/\\sqrt\{([^}]+)\}/g, '\u221A($1)')
    // Greek letters
    .replace(/\\alpha/g, '\u03B1')
    .replace(/\\beta/g, '\u03B2')
    .replace(/\\gamma/g, '\u03B3')
    .replace(/\\delta/g, '\u03B4')
    .replace(/\\pi/g, '\u03C0')
    .replace(/\\sigma/g, '\u03C3')
    .replace(/\\theta/g, '\u03B8')
    .replace(/\\omega/g, '\u03C9')
    .replace(/\\lambda/g, '\u03BB')
    .replace(/\\mu/g, '\u03BC')
    // Operators
    .replace(/\\times/g, '\u00D7')
    .replace(/\\div/g, '\u00F7')
    .replace(/\\pm/g, '\u00B1')
    .replace(/\\leq/g, '\u2264')
    .replace(/\\geq/g, '\u2265')
    .replace(/\\neq/g, '\u2260')
    .replace(/\\approx/g, '\u2248')
    .replace(/\\infty/g, '\u221E')
    .replace(/\\sum/g, '\u2211')
    .replace(/\\prod/g, '\u220F')
    .replace(/\\int/g, '\u222B')
    // Remove remaining backslashes
    .replace(/\\/g, '')

  return result
}

const MathBlockComponent = ({ node, updateAttributes, deleteNode }: MathBlockComponentProps) => {
  const { expression, displayMode } = node.attrs
  const [isEditing, setIsEditing] = useState(!expression)
  const [input, setInput] = useState(expression || '')

  const handleSave = () => {
    updateAttributes({ expression: input })
    setIsEditing(false)
  }

  if (!expression && !isEditing) {
    return (
      <NodeViewWrapper>
        <div
          className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-border my-2 bg-accent/20 cursor-pointer hover:bg-accent/30 transition-colors"
          contentEditable={false}
          onClick={() => setIsEditing(true)}
          data-testid="math-placeholder"
        >
          <Calculator className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Click to add equation</p>
        </div>
      </NodeViewWrapper>
    )
  }

  if (isEditing) {
    return (
      <NodeViewWrapper>
        <div
          className="p-4 rounded-lg border border-border my-2 bg-card"
          contentEditable={false}
          data-testid="math-editor"
        >
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Math Equation</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter LaTeX expression... (e.g., x^2 + y^2 = r^2)"
            className="w-full px-3 py-2 rounded-md border bg-background text-sm font-mono min-h-[80px] resize-none"
            autoFocus
          />
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4 mr-1" />
              Done
            </Button>
            <Button size="sm" variant="ghost" onClick={deleteNode}>
              <X className="h-4 w-4" />
            </Button>
            <label className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={displayMode}
                onChange={(e) => updateAttributes({ displayMode: e.target.checked })}
                className="rounded"
              />
              Display mode
            </label>
          </div>
          {input && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-1">Preview:</p>
              <div
                className={displayMode ? 'text-center text-xl py-2' : 'text-lg'}
                dangerouslySetInnerHTML={{ __html: renderMath(input) }}
              />
            </div>
          )}
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <div
        className={`group relative my-2 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer ${
          displayMode ? 'py-4 text-center' : 'py-2 px-3 inline-block'
        }`}
        contentEditable={false}
        onClick={() => setIsEditing(true)}
        data-testid="math-block"
      >
        <div
          className={`font-serif ${displayMode ? 'text-2xl' : 'text-lg'}`}
          dangerouslySetInnerHTML={{ __html: renderMath(expression || '') }}
        />
        <button
          onClick={(e) => {
            e.stopPropagation()
            deleteNode()
          }}
          className="absolute -top-2 -right-2 p-1 rounded-md bg-background border opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </NodeViewWrapper>
  )
}

export const MathBlock = Node.create({
  name: 'mathBlock',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      expression: {
        default: null,
      },
      displayMode: {
        default: true,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="math-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'math-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockComponent)
  },
})
