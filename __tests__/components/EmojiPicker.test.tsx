import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmojiPicker } from '@/components/EmojiPicker'

describe('EmojiPicker', () => {
  const mockOnSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render trigger children', () => {
      render(
        <EmojiPicker onSelect={mockOnSelect}>
          <button>Open Picker</button>
        </EmojiPicker>
      )
      expect(screen.getByText('Open Picker')).toBeInTheDocument()
    })

    it('should not show picker content initially', () => {
      render(
        <EmojiPicker onSelect={mockOnSelect}>
          <button>Open Picker</button>
        </EmojiPicker>
      )
      expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument()
    })

    it('should show picker content when trigger is clicked', async () => {
      render(
        <EmojiPicker onSelect={mockOnSelect}>
          <button>Open Picker</button>
        </EmojiPicker>
      )

      fireEvent.click(screen.getByText('Open Picker'))

      await waitFor(() => {
        expect(screen.getByTestId('emoji-picker')).toBeInTheDocument()
      })
    })
  })

  describe('emoji categories', () => {
    it('should display all emoji categories', async () => {
      render(
        <EmojiPicker onSelect={mockOnSelect}>
          <button>Open Picker</button>
        </EmojiPicker>
      )

      fireEvent.click(screen.getByText('Open Picker'))

      await waitFor(() => {
        expect(screen.getByText('Smileys')).toBeInTheDocument()
        expect(screen.getByText('Objects')).toBeInTheDocument()
        expect(screen.getByText('Symbols')).toBeInTheDocument()
        expect(screen.getByText('Nature')).toBeInTheDocument()
        expect(screen.getByText('Animals')).toBeInTheDocument()
        expect(screen.getByText('Food')).toBeInTheDocument()
      })
    })

    it('should display emojis from each category', async () => {
      render(
        <EmojiPicker onSelect={mockOnSelect}>
          <button>Open Picker</button>
        </EmojiPicker>
      )

      fireEvent.click(screen.getByText('Open Picker'))

      await waitFor(() => {
        // Check for some emojis from different categories
        expect(screen.getByTestId('emoji-😀')).toBeInTheDocument()
        expect(screen.getByTestId('emoji-📝')).toBeInTheDocument()
        expect(screen.getByTestId('emoji-❤️')).toBeInTheDocument()
      })
    })
  })

  describe('emoji selection', () => {
    it('should call onSelect when emoji is clicked', async () => {
      render(
        <EmojiPicker onSelect={mockOnSelect}>
          <button>Open Picker</button>
        </EmojiPicker>
      )

      fireEvent.click(screen.getByText('Open Picker'))

      await waitFor(() => {
        expect(screen.getByTestId('emoji-😀')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('emoji-😀'))

      expect(mockOnSelect).toHaveBeenCalledWith('😀')
    })

    it('should close picker after selection', async () => {
      render(
        <EmojiPicker onSelect={mockOnSelect}>
          <button>Open Picker</button>
        </EmojiPicker>
      )

      fireEvent.click(screen.getByText('Open Picker'))

      await waitFor(() => {
        expect(screen.getByTestId('emoji-picker')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('emoji-😀'))

      await waitFor(() => {
        expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument()
      })
    })
  })

  describe('remove emoji', () => {
    it('should have remove emoji button', async () => {
      render(
        <EmojiPicker onSelect={mockOnSelect}>
          <button>Open Picker</button>
        </EmojiPicker>
      )

      fireEvent.click(screen.getByText('Open Picker'))

      await waitFor(() => {
        expect(screen.getByText('Remove emoji')).toBeInTheDocument()
      })
    })

    it('should call onSelect with empty string when remove is clicked', async () => {
      render(
        <EmojiPicker onSelect={mockOnSelect}>
          <button>Open Picker</button>
        </EmojiPicker>
      )

      fireEvent.click(screen.getByText('Open Picker'))

      await waitFor(() => {
        expect(screen.getByText('Remove emoji')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Remove emoji'))

      expect(mockOnSelect).toHaveBeenCalledWith('')
    })
  })

  describe('search functionality', () => {
    it('should have search input', async () => {
      render(
        <EmojiPicker onSelect={mockOnSelect}>
          <button>Open Picker</button>
        </EmojiPicker>
      )

      fireEvent.click(screen.getByText('Open Picker'))

      await waitFor(() => {
        expect(screen.getByTestId('emoji-search')).toBeInTheDocument()
      })
    })

    it('should allow typing in search input', async () => {
      render(
        <EmojiPicker onSelect={mockOnSelect}>
          <button>Open Picker</button>
        </EmojiPicker>
      )

      fireEvent.click(screen.getByText('Open Picker'))

      await waitFor(() => {
        expect(screen.getByTestId('emoji-search')).toBeInTheDocument()
      })

      const searchInput = screen.getByTestId('emoji-search')
      await userEvent.type(searchInput, 'smile')

      expect(searchInput).toHaveValue('smile')
    })
  })

  describe('popover behavior', () => {
    it('should toggle open state when trigger is clicked', async () => {
      render(
        <EmojiPicker onSelect={mockOnSelect}>
          <button>Open Picker</button>
        </EmojiPicker>
      )

      // Open
      fireEvent.click(screen.getByText('Open Picker'))
      await waitFor(() => {
        expect(screen.getByTestId('emoji-picker')).toBeInTheDocument()
      })

      // Close by clicking trigger again (Radix popover behavior)
      fireEvent.click(screen.getByText('Open Picker'))
      await waitFor(() => {
        expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument()
      })
    })
  })
})
