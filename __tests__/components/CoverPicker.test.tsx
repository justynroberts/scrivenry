import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CoverPicker } from '@/components/CoverPicker'

describe('CoverPicker', () => {
  const mockOnSelect = jest.fn()
  const mockOnOpenChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render when open', () => {
      render(
        <CoverPicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )
      expect(screen.getByTestId('cover-picker')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(
        <CoverPicker
          open={false}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )
      expect(screen.queryByTestId('cover-picker')).not.toBeInTheDocument()
    })

    it('should display title', () => {
      render(
        <CoverPicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )
      expect(screen.getByText('Choose a cover')).toBeInTheDocument()
    })

    it('should display gradient section', () => {
      render(
        <CoverPicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )
      expect(screen.getByText('Color & Gradient')).toBeInTheDocument()
    })

    it('should display solid colors section', () => {
      render(
        <CoverPicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )
      expect(screen.getByText('Solid Colors')).toBeInTheDocument()
    })

    it('should display 12 gradient options', () => {
      render(
        <CoverPicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )
      for (let i = 0; i < 12; i++) {
        expect(screen.getByTestId(`cover-gradient-${i}`)).toBeInTheDocument()
      }
    })

    it('should display 12 solid color options', () => {
      render(
        <CoverPicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )
      for (let i = 0; i < 12; i++) {
        expect(screen.getByTestId(`cover-solid-${i}`)).toBeInTheDocument()
      }
    })
  })

  describe('gradient selection', () => {
    it('should call onSelect when gradient is clicked', () => {
      render(
        <CoverPicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )

      fireEvent.click(screen.getByTestId('cover-gradient-0'))

      expect(mockOnSelect).toHaveBeenCalledWith(
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      )
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('solid color selection', () => {
    it('should call onSelect when solid color is clicked', () => {
      render(
        <CoverPicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )

      fireEvent.click(screen.getByTestId('cover-solid-0'))

      expect(mockOnSelect).toHaveBeenCalledWith('#1a1a2e')
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('custom URL', () => {
    it('should have URL input', () => {
      render(
        <CoverPicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )
      expect(screen.getByTestId('cover-url-input')).toBeInTheDocument()
    })

    it('should allow typing custom URL', async () => {
      render(
        <CoverPicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )

      const input = screen.getByTestId('cover-url-input')
      await userEvent.type(input, 'https://example.com/image.jpg')

      expect(input).toHaveValue('https://example.com/image.jpg')
    })

    it('should have disabled submit button when URL is empty', () => {
      render(
        <CoverPicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )

      const submitButton = screen.getByText('Submit')
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when URL is entered', async () => {
      render(
        <CoverPicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )

      const input = screen.getByTestId('cover-url-input')
      await userEvent.type(input, 'https://example.com/image.jpg')

      const submitButton = screen.getByText('Submit')
      expect(submitButton).not.toBeDisabled()
    })

    it('should call onSelect with custom URL when submitted', async () => {
      render(
        <CoverPicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )

      const input = screen.getByTestId('cover-url-input')
      await userEvent.type(input, 'https://example.com/image.jpg')

      fireEvent.click(screen.getByText('Submit'))

      expect(mockOnSelect).toHaveBeenCalledWith('https://example.com/image.jpg')
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('remove cover', () => {
    it('should not show remove button when no current cover', () => {
      render(
        <CoverPicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.queryByText('Remove cover')).not.toBeInTheDocument()
    })

    it('should show remove button when cover exists', () => {
      render(
        <CoverPicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
          currentCover="https://example.com/image.jpg"
        />
      )

      expect(screen.getByText('Remove cover')).toBeInTheDocument()
    })

    it('should call onSelect with null when remove is clicked', () => {
      render(
        <CoverPicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
          currentCover="https://example.com/image.jpg"
        />
      )

      fireEvent.click(screen.getByText('Remove cover'))

      expect(mockOnSelect).toHaveBeenCalledWith(null)
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })
})
