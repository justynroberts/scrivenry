import React from 'react'
import { render, screen } from '@testing-library/react'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'

describe('KeyboardShortcuts', () => {
  const mockOnOpenChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render when open', () => {
      render(
        <KeyboardShortcuts open={true} onOpenChange={mockOnOpenChange} />
      )
      expect(screen.getByTestId('shortcuts-modal')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(
        <KeyboardShortcuts open={false} onOpenChange={mockOnOpenChange} />
      )
      expect(screen.queryByTestId('shortcuts-modal')).not.toBeInTheDocument()
    })

    it('should display title', () => {
      render(
        <KeyboardShortcuts open={true} onOpenChange={mockOnOpenChange} />
      )
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
    })
  })

  describe('categories', () => {
    it('should display Navigation category', () => {
      render(
        <KeyboardShortcuts open={true} onOpenChange={mockOnOpenChange} />
      )
      expect(screen.getByText('Navigation')).toBeInTheDocument()
    })

    it('should display Text Formatting category', () => {
      render(
        <KeyboardShortcuts open={true} onOpenChange={mockOnOpenChange} />
      )
      expect(screen.getByText('Text Formatting')).toBeInTheDocument()
    })

    it('should display Blocks category', () => {
      render(
        <KeyboardShortcuts open={true} onOpenChange={mockOnOpenChange} />
      )
      expect(screen.getByText('Blocks')).toBeInTheDocument()
    })

    it('should display Editing category', () => {
      render(
        <KeyboardShortcuts open={true} onOpenChange={mockOnOpenChange} />
      )
      expect(screen.getByText('Editing')).toBeInTheDocument()
    })
  })

  describe('shortcuts', () => {
    it('should display Quick search shortcut', () => {
      render(
        <KeyboardShortcuts open={true} onOpenChange={mockOnOpenChange} />
      )
      expect(screen.getByText('Quick search')).toBeInTheDocument()
    })

    it('should display Bold shortcut', () => {
      render(
        <KeyboardShortcuts open={true} onOpenChange={mockOnOpenChange} />
      )
      expect(screen.getByText('Bold')).toBeInTheDocument()
    })

    it('should display Undo shortcut', () => {
      render(
        <KeyboardShortcuts open={true} onOpenChange={mockOnOpenChange} />
      )
      expect(screen.getByText('Undo')).toBeInTheDocument()
    })

    it('should display Open block menu shortcut', () => {
      render(
        <KeyboardShortcuts open={true} onOpenChange={mockOnOpenChange} />
      )
      expect(screen.getByText('Open block menu')).toBeInTheDocument()
    })
  })

  describe('key display', () => {
    it('should display Cmd key', () => {
      render(
        <KeyboardShortcuts open={true} onOpenChange={mockOnOpenChange} />
      )
      const cmdKeys = screen.getAllByText('Cmd')
      expect(cmdKeys.length).toBeGreaterThan(0)
    })

    it('should display keyboard keys as kbd elements', () => {
      render(
        <KeyboardShortcuts open={true} onOpenChange={mockOnOpenChange} />
      )
      const kbdElements = document.querySelectorAll('kbd')
      expect(kbdElements.length).toBeGreaterThan(0)
    })

    it('should display slash key for block menu', () => {
      render(
        <KeyboardShortcuts open={true} onOpenChange={mockOnOpenChange} />
      )
      expect(screen.getByText('/')).toBeInTheDocument()
    })
  })

  describe('shortcut descriptions', () => {
    const expectedShortcuts = [
      'Quick search',
      'New page',
      'Toggle sidebar',
      'Bold',
      'Italic',
      'Underline',
      'Strikethrough',
      'Inline code',
      'Open block menu',
      'Heading 1',
      'Heading 2',
      'Heading 3',
      'Bullet list',
      'Numbered list',
      'Todo list',
      'Quote',
      'Code block',
      'Undo',
      'Redo',
      'Save',
      'Indent',
      'Outdent',
    ]

    it.each(expectedShortcuts)('should display %s shortcut', (description) => {
      render(
        <KeyboardShortcuts open={true} onOpenChange={mockOnOpenChange} />
      )
      expect(screen.getByText(description)).toBeInTheDocument()
    })
  })
})
