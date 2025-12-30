'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TourStep {
  target: string
  title: string
  description: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="sidebar"]',
    title: 'Your Pages',
    description: 'All your pages are organized here. Click any page to open it, or use the + button to create new ones.',
    position: 'right'
  },
  {
    target: '[data-tour="search"]',
    title: 'Quick Search',
    description: 'Press Cmd+K (or Ctrl+K) to quickly search across all your pages. You can also filter by tags.',
    position: 'right'
  },
  {
    target: '[data-tour="editor"]',
    title: 'Block Editor',
    description: 'Type / to open the slash command menu and insert blocks like headings, lists, code, charts, and more.',
    position: 'left'
  },
  {
    target: '[data-tour="page-actions"]',
    title: 'Page Actions',
    description: 'Star pages to add them to favorites, add tags for organization, or access the menu for more options.',
    position: 'bottom'
  },
  {
    target: '[data-tour="trash"]',
    title: 'Trash',
    description: 'Deleted pages go to trash where you can restore or permanently delete them.',
    position: 'right'
  }
]

interface WelcomeTourProps {
  onComplete: () => void
}

export function WelcomeTour({ onComplete }: WelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)

  const step = tourSteps[currentStep]

  useEffect(() => {
    if (!step) return

    const element = document.querySelector(step.target)
    if (element) {
      const rect = element.getBoundingClientRect()
      setHighlightRect(rect)
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentStep, step])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setIsVisible(false)
    localStorage.setItem('scrivenry-tour-completed', 'true')
    onComplete()
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!isVisible) return null

  const getTooltipPosition = () => {
    if (!highlightRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

    const padding = 16
    const tooltipWidth = 320
    const tooltipHeight = 180
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let top: number
    let left: number

    switch (step.position) {
      case 'right':
        top = highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2
        left = highlightRect.right + padding
        break
      case 'left':
        top = highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2
        left = highlightRect.left - tooltipWidth - padding
        break
      case 'bottom':
        top = highlightRect.bottom + padding
        left = highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2
        break
      case 'top':
        top = highlightRect.top - tooltipHeight - padding
        left = highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2
        break
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }

    // Keep tooltip within viewport bounds
    if (left < padding) left = padding
    if (left + tooltipWidth > viewportWidth - padding) left = viewportWidth - tooltipWidth - padding
    if (top < padding) top = padding
    if (top + tooltipHeight > viewportHeight - padding) top = viewportHeight - tooltipHeight - padding

    return { top: `${top}px`, left: `${left}px` }
  }

  const tooltipStyle = getTooltipPosition()

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/60" onClick={handleSkip} />

      {/* Highlight cutout */}
      {highlightRect && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
            borderRadius: '8px',
            border: '2px solid #8b5cf6'
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[10000] w-80 bg-card border rounded-lg shadow-xl p-4"
        style={tooltipStyle}
      >
        <button
          onClick={handleSkip}
          className="absolute top-2 right-2 p-1 rounded hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          <h3 className="font-semibold text-lg">{step.title}</h3>
        </div>

        <p className="text-muted-foreground text-sm mb-4">
          {step.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-violet-500' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="ghost" size="sm" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {currentStep === tourSteps.length - 1 ? (
                'Get Started'
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
