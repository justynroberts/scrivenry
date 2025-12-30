'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { Star } from 'lucide-react'

interface RatingBlockProps {
  node: {
    attrs: {
      rating: number
      maxRating: number
      label: string
      size: 'sm' | 'md' | 'lg'
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
}

function RatingBlockComponent({ node, updateAttributes }: RatingBlockProps) {
  const [rating, setRating] = useState(node.attrs.rating || 0)
  const [maxRating, setMaxRating] = useState(node.attrs.maxRating || 5)
  const [label, setLabel] = useState(node.attrs.label || '')
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>(node.attrs.size || 'md')

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  const handleRatingChange = (newRating: number) => {
    setRating(newRating)
    updateAttributes({ rating: newRating, maxRating, label, size })
  }

  const handleMaxRatingChange = (newMax: number) => {
    const clampedMax = Math.max(1, Math.min(10, newMax))
    setMaxRating(clampedMax)
    if (rating > clampedMax) {
      setRating(clampedMax)
    }
    updateAttributes({ rating: Math.min(rating, clampedMax), maxRating: clampedMax, label, size })
  }

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel)
    updateAttributes({ rating, maxRating, label: newLabel, size })
  }

  const handleSizeChange = (newSize: 'sm' | 'md' | 'lg') => {
    setSize(newSize)
    updateAttributes({ rating, maxRating, label, size: newSize })
  }

  return (
    <NodeViewWrapper className="my-4">
      <div className="inline-flex flex-col gap-2 p-3 border border-amber-500/30 rounded-lg bg-amber-950/20">
        {/* Label input */}
        <input
          type="text"
          value={label}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="Add label (optional)"
          className="text-sm text-amber-300 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-amber-500 rounded px-1"
        />

        {/* Stars */}
        <div className="flex items-center gap-1">
          {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
            <button
              key={star}
              onClick={() => handleRatingChange(star === rating ? 0 : star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(null)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`${sizeClasses[size]} transition-colors ${
                  star <= (hoveredStar ?? rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-transparent text-amber-600'
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-amber-400">
            {rating}/{maxRating}
          </span>
        </div>

        {/* Settings */}
        <div className="flex items-center gap-3 text-xs text-amber-400/60">
          <label className="flex items-center gap-1">
            Max:
            <input
              type="number"
              value={maxRating}
              onChange={(e) => handleMaxRatingChange(parseInt(e.target.value) || 5)}
              min={1}
              max={10}
              className="w-12 px-1 py-0.5 bg-amber-900/30 border border-amber-500/30 rounded text-amber-300"
            />
          </label>
          <label className="flex items-center gap-1">
            Size:
            <select
              value={size}
              onChange={(e) => handleSizeChange(e.target.value as 'sm' | 'md' | 'lg')}
              className="px-1 py-0.5 bg-amber-900/30 border border-amber-500/30 rounded text-amber-300"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </label>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const RatingBlock = Node.create({
  name: 'ratingBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      rating: { default: 0 },
      maxRating: { default: 5 },
      label: { default: '' },
      size: { default: 'md' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="rating-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'rating-block' })]
  },

  addNodeView() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ReactNodeViewRenderer(RatingBlockComponent as any)
  },
})
