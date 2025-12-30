import React from 'react'
import { render, screen } from '@testing-library/react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'

describe('Tooltip components', () => {
  describe('TooltipProvider', () => {
    it('should render children', () => {
      render(
        <TooltipProvider>
          <div>Provider content</div>
        </TooltipProvider>
      )
      expect(screen.getByText('Provider content')).toBeInTheDocument()
    })
  })

  describe('Tooltip', () => {
    it('should render trigger element', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Hover me</TooltipTrigger>
            <TooltipContent>Tooltip text</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      expect(screen.getByText('Hover me')).toBeInTheDocument()
    })
  })

  describe('TooltipTrigger', () => {
    it('should render button by default', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Click me</TooltipTrigger>
            <TooltipContent>Tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should allow asChild prop', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>Custom trigger</span>
            </TooltipTrigger>
            <TooltipContent>Tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      expect(screen.getByText('Custom trigger')).toBeInTheDocument()
    })
  })

  describe('exports', () => {
    it('should export all tooltip components', () => {
      expect(Tooltip).toBeDefined()
      expect(TooltipTrigger).toBeDefined()
      expect(TooltipContent).toBeDefined()
      expect(TooltipProvider).toBeDefined()
    })
  })
})
