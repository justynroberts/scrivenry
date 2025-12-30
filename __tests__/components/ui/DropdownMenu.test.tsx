import React from 'react'
import { render, screen } from '@testing-library/react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from '@/components/ui/dropdown-menu'

describe('DropdownMenu components', () => {
  describe('exports', () => {
    it('should export all dropdown menu components', () => {
      expect(DropdownMenu).toBeDefined()
      expect(DropdownMenuTrigger).toBeDefined()
      expect(DropdownMenuContent).toBeDefined()
      expect(DropdownMenuItem).toBeDefined()
      expect(DropdownMenuCheckboxItem).toBeDefined()
      expect(DropdownMenuRadioItem).toBeDefined()
      expect(DropdownMenuLabel).toBeDefined()
      expect(DropdownMenuSeparator).toBeDefined()
      expect(DropdownMenuShortcut).toBeDefined()
      expect(DropdownMenuGroup).toBeDefined()
      expect(DropdownMenuPortal).toBeDefined()
      expect(DropdownMenuSub).toBeDefined()
      expect(DropdownMenuSubContent).toBeDefined()
      expect(DropdownMenuSubTrigger).toBeDefined()
      expect(DropdownMenuRadioGroup).toBeDefined()
    })
  })

  describe('DropdownMenu', () => {
    it('should render trigger element', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Open Menu')).toBeInTheDocument()
    })

    it('should render menu content when defaultOpen is true', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByText('Item 1')).toBeInTheDocument()
    })
  })

  describe('DropdownMenuItem', () => {
    it('should render menu item with inset prop', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset data-testid="inset-item">
              Inset Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByTestId('inset-item')).toHaveClass('pl-8')
    })

    it('should apply custom className', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem className="custom-class" data-testid="custom-item">
              Custom Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByTestId('custom-item')).toHaveClass('custom-class')
    })
  })

  describe('DropdownMenuLabel', () => {
    it('should render label', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByText('My Label')).toBeInTheDocument()
    })

    it('should render label with inset prop', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset data-testid="inset-label">
              Inset Label
            </DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByTestId('inset-label')).toHaveClass('pl-8')
    })
  })

  describe('DropdownMenuSeparator', () => {
    it('should render separator', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator data-testid="separator" />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByTestId('separator')).toBeInTheDocument()
    })
  })

  describe('DropdownMenuShortcut', () => {
    it('should render shortcut text', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut>Cmd+S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByText('Cmd+S')).toBeInTheDocument()
    })

    it('should apply custom className to shortcut', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut className="custom-shortcut" data-testid="shortcut">
                Cmd+S
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByTestId('shortcut')).toHaveClass('custom-shortcut')
    })
  })

  describe('DropdownMenuCheckboxItem', () => {
    it('should render checkbox item', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>
              Checked Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByText('Checked Item')).toBeInTheDocument()
    })

    it('should render unchecked checkbox item', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={false}>
              Unchecked Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByText('Unchecked Item')).toBeInTheDocument()
    })
  })

  describe('DropdownMenuRadioGroup', () => {
    it('should render radio group with items', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
    })
  })

  describe('DropdownMenuSubTrigger', () => {
    it('should render sub trigger', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByText('More Options')).toBeInTheDocument()
    })

    it('should render sub trigger with inset', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger inset data-testid="inset-subtrigger">
                More Options
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByTestId('inset-subtrigger')).toHaveClass('pl-8')
    })
  })

  describe('DropdownMenuGroup', () => {
    it('should render menu group', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Grouped Item 1</DropdownMenuItem>
              <DropdownMenuItem>Grouped Item 2</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByText('Grouped Item 1')).toBeInTheDocument()
      expect(screen.getByText('Grouped Item 2')).toBeInTheDocument()
    })
  })

  describe('DropdownMenuContent', () => {
    it('should apply custom sideOffset', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={10} data-testid="content">
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('should apply custom className to content', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent className="custom-content" data-testid="content">
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByTestId('content')).toHaveClass('custom-content')
    })
  })

  describe('DropdownMenuSubContent', () => {
    it('should apply custom className', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub open>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="custom-sub" data-testid="subcontent">
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByTestId('subcontent')).toHaveClass('custom-sub')
    })
  })
})
