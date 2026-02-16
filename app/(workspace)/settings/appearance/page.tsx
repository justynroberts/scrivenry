'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor, Palette, Leaf, Waves, Sparkles, Coffee, Snowflake, Heart, Type, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system' | 'sepia' | 'nord' | 'dracula' | 'solarized-dark' | 'solarized-light' | 'ocean' | 'forest' | 'rose' | 'midnight'
type Font = 'inter' | 'merriweather' | 'source-sans' | 'roboto' | 'open-sans' | 'lato' | 'nunito' | 'poppins' | 'space-grotesk' | 'system'
type ContentWidth = 'narrow' | 'medium' | 'wide' | 'full'

interface ThemeOption {
  value: Theme
  label: string
  icon: React.ComponentType<{ className?: string }>
  preview: {
    bg: string
    accent: string
  }
}

interface FontOption {
  value: Font
  label: string
  className: string
  sample: string
}

interface ContentWidthOption {
  value: ContentWidth
  label: string
  description: string
  cssClass: string
}

export default function AppearancePage() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [font, setFont] = useState<Font>('inter')
  const [contentWidth, setContentWidth] = useState<ContentWidth>('medium')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    const savedFont = localStorage.getItem('font') as Font | null
    const savedWidth = localStorage.getItem('contentWidth') as ContentWidth | null
    if (savedTheme) {
      setTheme(savedTheme)
      applyThemeClass(savedTheme)
    }
    if (savedFont) {
      setFont(savedFont)
      applyFontClass(savedFont)
    }
    if (savedWidth) {
      setContentWidth(savedWidth)
    }
  }, [])

  function applyThemeClass(newTheme: Theme) {
    const root = document.documentElement
    root.classList.remove('dark', 'sepia', 'nord', 'dracula', 'solarized-dark', 'solarized-light', 'ocean', 'forest', 'rose', 'midnight')

    if (newTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemDark) root.classList.add('dark')
    } else if (newTheme === 'light') {
      // Light is the default (no class needed)
    } else {
      root.classList.add(newTheme)
    }
  }

  function applyFontClass(newFont: Font) {
    const body = document.body
    // Remove all font classes
    body.classList.remove('font-inter', 'font-merriweather', 'font-source-sans', 'font-roboto', 'font-open-sans', 'font-lato', 'font-nunito', 'font-poppins', 'font-space-grotesk', 'font-system')
    body.classList.add(`font-${newFont}`)
  }

  function applyTheme(newTheme: Theme) {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyThemeClass(newTheme)
  }

  function applyFont(newFont: Font) {
    setFont(newFont)
    localStorage.setItem('font', newFont)
    applyFontClass(newFont)
  }

  function applyWidth(newWidth: ContentWidth) {
    setContentWidth(newWidth)
    localStorage.setItem('contentWidth', newWidth)
    // Dispatch event so page editor can react
    window.dispatchEvent(new CustomEvent('contentWidthChange', { detail: newWidth }))
  }

  const contentWidths: ContentWidthOption[] = [
    { value: 'narrow', label: 'Narrow', description: 'Best for focused reading', cssClass: 'max-w-2xl' },
    { value: 'medium', label: 'Medium', description: 'Balanced layout (default)', cssClass: 'max-w-3xl' },
    { value: 'wide', label: 'Wide', description: 'More space for tables', cssClass: 'max-w-5xl' },
    { value: 'full', label: 'Full', description: 'Use all available width', cssClass: 'max-w-none' },
  ]

  const themes: ThemeOption[] = [
    { value: 'light', label: 'Light', icon: Sun, preview: { bg: '#ffffff', accent: '#171717' } },
    { value: 'dark', label: 'Dark', icon: Moon, preview: { bg: '#121212', accent: '#fafafa' } },
    { value: 'system', label: 'System', icon: Monitor, preview: { bg: '#808080', accent: '#ffffff' } },
    { value: 'sepia', label: 'Sepia', icon: Coffee, preview: { bg: '#f4ede4', accent: '#7a5c3e' } },
    { value: 'nord', label: 'Nord', icon: Snowflake, preview: { bg: '#2e3440', accent: '#88c0d0' } },
    { value: 'dracula', label: 'Dracula', icon: Sparkles, preview: { bg: '#282a36', accent: '#bd93f9' } },
    { value: 'solarized-dark', label: 'Solarized Dark', icon: Palette, preview: { bg: '#002b36', accent: '#2aa198' } },
    { value: 'solarized-light', label: 'Solarized Light', icon: Sun, preview: { bg: '#fdf6e3', accent: '#2aa198' } },
    { value: 'ocean', label: 'Ocean', icon: Waves, preview: { bg: '#1a2634', accent: '#0ea5e9' } },
    { value: 'forest', label: 'Forest', icon: Leaf, preview: { bg: '#1a2419', accent: '#22c55e' } },
    { value: 'rose', label: 'Rose', icon: Heart, preview: { bg: '#241a1d', accent: '#f472b6' } },
    { value: 'midnight', label: 'Midnight', icon: Moon, preview: { bg: '#0f0f1a', accent: '#a78bfa' } },
  ]

  const fonts: FontOption[] = [
    { value: 'inter', label: 'Inter', className: 'font-inter', sample: 'The quick brown fox jumps over the lazy dog' },
    { value: 'system', label: 'System', className: 'font-system', sample: 'The quick brown fox jumps over the lazy dog' },
    { value: 'merriweather', label: 'Merriweather', className: 'font-merriweather', sample: 'The quick brown fox jumps over the lazy dog' },
    { value: 'source-sans', label: 'Source Sans', className: 'font-source-sans', sample: 'The quick brown fox jumps over the lazy dog' },
    { value: 'roboto', label: 'Roboto', className: 'font-roboto', sample: 'The quick brown fox jumps over the lazy dog' },
    { value: 'open-sans', label: 'Open Sans', className: 'font-open-sans', sample: 'The quick brown fox jumps over the lazy dog' },
    { value: 'lato', label: 'Lato', className: 'font-lato', sample: 'The quick brown fox jumps over the lazy dog' },
    { value: 'nunito', label: 'Nunito', className: 'font-nunito', sample: 'The quick brown fox jumps over the lazy dog' },
    { value: 'poppins', label: 'Poppins', className: 'font-poppins', sample: 'The quick brown fox jumps over the lazy dog' },
    { value: 'space-grotesk', label: 'Space Grotesk', className: 'font-space-grotesk', sample: 'The quick brown fox jumps over the lazy dog' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <h1 className="text-3xl font-bold mb-2">Appearance</h1>
      <p className="text-muted-foreground mb-8">Customize the look and feel of your workspace</p>

      {/* Theme Section */}
      <div>
        <h2 className="text-lg font-medium mb-4">Theme</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {themes.map(({ value, label, icon: Icon, preview }) => (
            <Button
              key={value}
              variant="outline"
              onClick={() => applyTheme(value)}
              className={cn(
                'h-auto py-4 flex-col gap-3 relative overflow-hidden',
                theme === value && 'ring-2 ring-primary border-primary'
              )}
            >
              <div
                className="w-full h-12 rounded-md flex items-center justify-center"
                style={{ backgroundColor: preview.bg }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: preview.accent }}
                >
                  <div style={{ color: preview.bg }}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <span className="text-sm font-medium">{label}</span>
              {theme === value && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Font Section */}
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-4">
          <Type className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-medium">Font</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fonts.map(({ value, label, className, sample }) => (
            <Button
              key={value}
              variant="outline"
              onClick={() => applyFont(value)}
              className={cn(
                'h-auto py-4 flex-col items-start gap-2 relative',
                font === value && 'ring-2 ring-primary border-primary'
              )}
            >
              <span className="text-sm font-medium">{label}</span>
              <span className={cn('text-xs text-muted-foreground truncate w-full', className)}>
                {sample}
              </span>
              {font === value && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Content Width Section */}
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-4">
          <Maximize2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-medium">Content Width</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {contentWidths.map(({ value, label, description }) => (
            <Button
              key={value}
              variant="outline"
              onClick={() => applyWidth(value)}
              className={cn(
                'h-auto py-4 flex-col items-start gap-1 relative',
                contentWidth === value && 'ring-2 ring-primary border-primary'
              )}
            >
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
              {contentWidth === value && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Preview Section */}
      <div className="mt-12">
        <h2 className="text-lg font-medium mb-4">Preview</h2>
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">N</span>
            </div>
            <div>
              <h3 className="font-semibold">Scrivenry</h3>
              <p className="text-sm text-muted-foreground">Your workspace theme preview</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg">This is how your text will look</p>
            <p className="text-sm text-muted-foreground">
              The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">Secondary</Button>
            <Button size="sm" variant="outline">Outline</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
