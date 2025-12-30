import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input component', () => {
  describe('rendering', () => {
    it('should render an input element', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      render(<Input className="custom-class" />)
      expect(screen.getByRole('textbox')).toHaveClass('custom-class')
    })

    it('should apply default styles', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input.className).toContain('rounded-md')
      expect(input.className).toContain('border')
    })
  })

  describe('types', () => {
    it('should render text input by default', () => {
      render(<Input />)
      // Input without type prop defaults to text, but attribute may not be set
      const input = screen.getByRole('textbox')
      expect(input.getAttribute('type')).toBeNull()
    })

    it('should render password input', () => {
      render(<Input type="password" data-testid="password-input" />)
      expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password')
    })

    it('should render email input', () => {
      render(<Input type="email" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
    })

    it('should render number input', () => {
      render(<Input type="number" />)
      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number')
    })
  })

  describe('attributes', () => {
    it('should apply placeholder', () => {
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('should apply disabled attribute', () => {
      render(<Input disabled />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('should apply required attribute', () => {
      render(<Input required />)
      expect(screen.getByRole('textbox')).toBeRequired()
    })

    it('should apply value', () => {
      render(<Input value="test value" onChange={() => {}} />)
      expect(screen.getByRole('textbox')).toHaveValue('test value')
    })

    it('should apply name attribute', () => {
      render(<Input name="username" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'username')
    })

    it('should apply id attribute', () => {
      render(<Input id="my-input" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'my-input')
    })
  })

  describe('interactions', () => {
    it('should call onChange when value changes', async () => {
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)

      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'test')

      expect(handleChange).toHaveBeenCalled()
    })

    it('should call onFocus when focused', () => {
      const handleFocus = jest.fn()
      render(<Input onFocus={handleFocus} />)

      fireEvent.focus(screen.getByRole('textbox'))
      expect(handleFocus).toHaveBeenCalledTimes(1)
    })

    it('should call onBlur when blurred', () => {
      const handleBlur = jest.fn()
      render(<Input onBlur={handleBlur} />)

      const input = screen.getByRole('textbox')
      fireEvent.focus(input)
      fireEvent.blur(input)
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    it('should update value on user input', async () => {
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)

      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'hello')

      expect(input).toHaveValue('hello')
    })
  })

  describe('ref forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>()
      render(<Input ref={ref} />)
      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('should allow programmatic focus via ref', () => {
      const ref = React.createRef<HTMLInputElement>()
      render(<Input ref={ref} />)

      ref.current?.focus()
      expect(document.activeElement).toBe(ref.current)
    })
  })

  describe('accessibility', () => {
    it('should support aria-label', () => {
      render(<Input aria-label="Username" />)
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="help-text" />
          <span id="help-text">Enter your username</span>
        </>
      )
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('should support aria-invalid', () => {
      render(<Input aria-invalid="true" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('styling', () => {
    it('should have focus ring styles', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input.className).toContain('focus-visible:ring')
    })

    it('should have disabled styles', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input.className).toContain('disabled:opacity-50')
    })
  })
})
