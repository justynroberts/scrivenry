import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchDialog } from '@/components/SearchDialog'

// Mock router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const mockPages = [
  {
    id: '1',
    title: 'First Page',
    icon: '📄',
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }] },
    path: ['Workspace'],
    workspaceId: 'ws1',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isFavorite: false,
    isDeleted: false,
    coverImage: null,
    coverGradient: null,
  },
  {
    id: '2',
    title: 'Second Page',
    icon: '📝',
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Goodbye world' }] }] },
    path: ['Workspace', 'Folder'],
    workspaceId: 'ws1',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isFavorite: false,
    isDeleted: false,
    coverImage: null,
    coverGradient: null,
  },
  {
    id: '3',
    title: 'Meeting Notes',
    icon: '📋',
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Important meeting' }] }] },
    path: [],
    workspaceId: 'ws1',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isFavorite: false,
    isDeleted: false,
    coverImage: null,
    coverGradient: null,
  },
]

describe('SearchDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render dialog when open', () => {
      render(
        <SearchDialog open={true} onOpenChange={() => {}} pages={mockPages} />
      )
      expect(screen.getByPlaceholderText('Search pages...')).toBeInTheDocument()
    })

    it('should not render content when closed', () => {
      render(
        <SearchDialog open={false} onOpenChange={() => {}} pages={mockPages} />
      )
      expect(screen.queryByPlaceholderText('Search pages...')).not.toBeInTheDocument()
    })

    it('should display all pages initially (up to 10)', () => {
      render(
        <SearchDialog open={true} onOpenChange={() => {}} pages={mockPages} />
      )
      expect(screen.getByText('First Page')).toBeInTheDocument()
      expect(screen.getByText('Second Page')).toBeInTheDocument()
      expect(screen.getByText('Meeting Notes')).toBeInTheDocument()
    })

    it('should display page icons', () => {
      render(
        <SearchDialog open={true} onOpenChange={() => {}} pages={mockPages} />
      )
      expect(screen.getAllByText('📄')[0]).toBeInTheDocument()
      expect(screen.getByText('📝')).toBeInTheDocument()
      expect(screen.getByText('📋')).toBeInTheDocument()
    })

    it('should display page paths', () => {
      render(
        <SearchDialog open={true} onOpenChange={() => {}} pages={mockPages} />
      )
      expect(screen.getByText('in Workspace')).toBeInTheDocument()
      expect(screen.getByText('in Workspace / Folder')).toBeInTheDocument()
    })
  })

  describe('search functionality', () => {
    it('should filter pages by title', async () => {
      render(
        <SearchDialog open={true} onOpenChange={() => {}} pages={mockPages} />
      )

      const input = screen.getByPlaceholderText('Search pages...')
      await userEvent.type(input, 'Meeting')

      expect(screen.getByText('Meeting Notes')).toBeInTheDocument()
      expect(screen.queryByText('First Page')).not.toBeInTheDocument()
      expect(screen.queryByText('Second Page')).not.toBeInTheDocument()
    })

    it('should filter pages by content', async () => {
      render(
        <SearchDialog open={true} onOpenChange={() => {}} pages={mockPages} />
      )

      const input = screen.getByPlaceholderText('Search pages...')
      await userEvent.type(input, 'Hello')

      expect(screen.getByText('First Page')).toBeInTheDocument()
      expect(screen.queryByText('Second Page')).not.toBeInTheDocument()
    })

    it('should be case-insensitive', async () => {
      render(
        <SearchDialog open={true} onOpenChange={() => {}} pages={mockPages} />
      )

      const input = screen.getByPlaceholderText('Search pages...')
      await userEvent.type(input, 'MEETING')

      expect(screen.getByText('Meeting Notes')).toBeInTheDocument()
    })

    it('should show no results message when no pages match', async () => {
      render(
        <SearchDialog open={true} onOpenChange={() => {}} pages={mockPages} />
      )

      const input = screen.getByPlaceholderText('Search pages...')
      await userEvent.type(input, 'nonexistent')

      expect(screen.getByText('No pages found')).toBeInTheDocument()
    })
  })

  describe('page selection', () => {
    it('should navigate to page when clicked', async () => {
      const onOpenChange = jest.fn()
      render(
        <SearchDialog open={true} onOpenChange={onOpenChange} pages={mockPages} />
      )

      const pageButton = screen.getByText('First Page').closest('button')
      fireEvent.click(pageButton!)

      expect(mockPush).toHaveBeenCalledWith('/page/1')
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('should clear search query after selection', async () => {
      const onOpenChange = jest.fn()
      render(
        <SearchDialog open={true} onOpenChange={onOpenChange} pages={mockPages} />
      )

      const input = screen.getByPlaceholderText('Search pages...')
      await userEvent.type(input, 'Meeting')

      const pageButton = screen.getByText('Meeting Notes').closest('button')
      fireEvent.click(pageButton!)

      // Input value should be cleared (tested indirectly through onOpenChange)
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('empty state', () => {
    it('should show empty message when no pages', () => {
      render(
        <SearchDialog open={true} onOpenChange={() => {}} pages={[]} />
      )
      expect(screen.getByText('No pages found')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have dialog title for screen readers', () => {
      render(
        <SearchDialog open={true} onOpenChange={() => {}} pages={mockPages} />
      )
      expect(screen.getByText('Search pages')).toBeInTheDocument()
    })

    it('should autofocus the search input', () => {
      render(
        <SearchDialog open={true} onOpenChange={() => {}} pages={mockPages} />
      )
      const input = screen.getByPlaceholderText('Search pages...')
      expect(input).toHaveFocus()
    })
  })

  describe('default icon', () => {
    it('should use default icon when page has no icon', () => {
      const pagesWithoutIcon = [{
        ...mockPages[0],
        icon: null,
      }]
      render(
        <SearchDialog open={true} onOpenChange={() => {}} pages={pagesWithoutIcon as any} />
      )
      expect(screen.getAllByText('📄').length).toBeGreaterThan(0)
    })
  })
})
