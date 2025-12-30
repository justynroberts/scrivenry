'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

// Animated covers (stored as class names with animated: prefix)
const ANIMATED_COVERS = [
  { id: 'animated:aurora', name: 'Aurora', className: 'cover-aurora' },
  { id: 'animated:ocean', name: 'Ocean', className: 'cover-ocean' },
  { id: 'animated:sunset', name: 'Sunset', className: 'cover-sunset' },
  { id: 'animated:matrix', name: 'Matrix', className: 'cover-matrix' },
  { id: 'animated:pulse', name: 'Pulse', className: 'cover-pulse' },
  { id: 'animated:rainbow', name: 'Rainbow', className: 'cover-rainbow' },
  { id: 'animated:nebula', name: 'Nebula', className: 'cover-nebula' },
  { id: 'animated:fire', name: 'Fire', className: 'cover-fire' },
  { id: 'animated:cyber', name: 'Cyber Grid', className: 'cover-cyber' },
  { id: 'animated:wave', name: 'Wave', className: 'cover-wave' },
  { id: 'animated:starfield', name: 'Starfield', className: 'cover-starfield' },
  { id: 'animated:northern-lights', name: 'Northern Lights', className: 'cover-northern-lights' },
  { id: 'animated:synthwave', name: 'Synthwave', className: 'cover-synthwave' },
  { id: 'animated:deep-space', name: 'Deep Space', className: 'cover-deep-space' },
  { id: 'animated:electric', name: 'Electric', className: 'cover-electric' },
  { id: 'animated:holographic', name: 'Holographic', className: 'cover-holographic' },
  { id: 'animated:underwater', name: 'Underwater', className: 'cover-underwater' },
  { id: 'animated:cosmic-dust', name: 'Cosmic Dust', className: 'cover-cosmic-dust' },
  { id: 'animated:neon-city', name: 'Neon City', className: 'cover-neon-city' },
  { id: 'animated:lava', name: 'Lava', className: 'cover-lava' },
  { id: 'animated:galaxy', name: 'Galaxy', className: 'cover-galaxy' },
]

// Gradient covers
const GRADIENT_COVERS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
  'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)',
  'linear-gradient(135deg, #cd9cf2 0%, #f6f3ff 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
]

// Solid colors
const SOLID_COVERS = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483',
  '#e94560', '#f38181', '#fce38a', '#eaffd0',
  '#95e1d3', '#f9ed69', '#f08a5d', '#b83b5e',
]

interface CoverPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (cover: string | null) => void
  currentCover?: string | null
}

export function CoverPicker({ open, onOpenChange, onSelect, currentCover }: CoverPickerProps) {
  const [customUrl, setCustomUrl] = useState('')

  const handleSelect = (cover: string) => {
    onSelect(cover)
    onOpenChange(false)
  }

  const handleCustomUrl = () => {
    if (customUrl.trim()) {
      onSelect(customUrl.trim())
      onOpenChange(false)
      setCustomUrl('')
    }
  }

  const handleRemove = () => {
    onSelect(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="cover-picker">
        <DialogHeader>
          <DialogTitle>Choose a cover</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-96">
          <div className="space-y-6">
            {/* Animated Covers */}
            <div>
              <p className="text-sm font-medium mb-2">Animated</p>
              <div className="grid grid-cols-5 gap-2">
                {ANIMATED_COVERS.map((cover) => (
                  <button
                    key={cover.id}
                    className={`h-16 rounded-md border-2 border-transparent hover:border-primary transition-colors relative overflow-hidden ${cover.className}`}
                    onClick={() => handleSelect(cover.id)}
                    data-testid={`cover-${cover.id}`}
                    title={cover.name}
                  >
                    <span className="absolute bottom-1 left-1 text-[10px] text-white/70 bg-black/30 px-1 rounded">
                      {cover.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL */}
            <div>
              <p className="text-sm font-medium mb-2">Link</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste an image URL..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  data-testid="cover-url-input"
                />
                <Button onClick={handleCustomUrl} disabled={!customUrl.trim()}>
                  Submit
                </Button>
              </div>
            </div>

            {/* Gradients */}
            <div>
              <p className="text-sm font-medium mb-2">Color & Gradient</p>
              <div className="grid grid-cols-6 gap-2">
                {GRADIENT_COVERS.map((gradient, i) => (
                  <button
                    key={i}
                    className="h-16 rounded-md border-2 border-transparent hover:border-primary transition-colors"
                    style={{ background: gradient }}
                    onClick={() => handleSelect(gradient)}
                    data-testid={`cover-gradient-${i}`}
                  />
                ))}
              </div>
            </div>

            {/* Solid Colors */}
            <div>
              <p className="text-sm font-medium mb-2">Solid Colors</p>
              <div className="grid grid-cols-6 gap-2">
                {SOLID_COVERS.map((color, i) => (
                  <button
                    key={i}
                    className="h-16 rounded-md border-2 border-transparent hover:border-primary transition-colors"
                    style={{ background: color }}
                    onClick={() => handleSelect(color)}
                    data-testid={`cover-solid-${i}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {currentCover && (
          <div className="flex justify-end pt-4 border-t">
            <Button variant="destructive" onClick={handleRemove}>
              Remove cover
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
