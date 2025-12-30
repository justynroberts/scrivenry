import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { TemplatePicker } from '@/components/TemplatePicker'
import { PAGE_TEMPLATES } from '@/lib/templates'

describe('TemplatePicker', () => {
  const mockOnSelect = jest.fn()
  const mockOnOpenChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render when open', () => {
      render(
        <TemplatePicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )
      expect(screen.getByTestId('template-picker')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(
        <TemplatePicker
          open={false}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )
      expect(screen.queryByTestId('template-picker')).not.toBeInTheDocument()
    })

    it('should display title', () => {
      render(
        <TemplatePicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )
      expect(screen.getByText('Choose a Template')).toBeInTheDocument()
    })
  })

  describe('templates display', () => {
    it('should display all templates', () => {
      render(
        <TemplatePicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )

      PAGE_TEMPLATES.forEach((template) => {
        expect(screen.getByTestId(`template-${template.id}`)).toBeInTheDocument()
      })
    })

    it('should display template names', () => {
      render(
        <TemplatePicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )

      PAGE_TEMPLATES.forEach((template) => {
        expect(screen.getByText(template.name)).toBeInTheDocument()
      })
    })

    it('should display template descriptions', () => {
      render(
        <TemplatePicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )

      PAGE_TEMPLATES.forEach((template) => {
        expect(screen.getByText(template.description)).toBeInTheDocument()
      })
    })

    it('should display template icons', () => {
      render(
        <TemplatePicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )

      PAGE_TEMPLATES.forEach((template) => {
        expect(screen.getByText(template.icon)).toBeInTheDocument()
      })
    })
  })

  describe('template selection', () => {
    it('should call onSelect when template is clicked', () => {
      render(
        <TemplatePicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )

      fireEvent.click(screen.getByTestId('template-blank'))

      const blankTemplate = PAGE_TEMPLATES.find((t) => t.id === 'blank')
      expect(mockOnSelect).toHaveBeenCalledWith(blankTemplate)
    })

    it('should close dialog after selection', () => {
      render(
        <TemplatePicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )

      fireEvent.click(screen.getByTestId('template-blank'))

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('should pass correct template when meeting-notes is clicked', () => {
      render(
        <TemplatePicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )

      fireEvent.click(screen.getByTestId('template-meeting-notes'))

      const meetingNotesTemplate = PAGE_TEMPLATES.find((t) => t.id === 'meeting-notes')
      expect(mockOnSelect).toHaveBeenCalledWith(meetingNotesTemplate)
    })

    it('should pass correct template when project-plan is clicked', () => {
      render(
        <TemplatePicker
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelect={mockOnSelect}
        />
      )

      fireEvent.click(screen.getByTestId('template-project-plan'))

      const projectPlanTemplate = PAGE_TEMPLATES.find((t) => t.id === 'project-plan')
      expect(mockOnSelect).toHaveBeenCalledWith(projectPlanTemplate)
    })
  })
})
