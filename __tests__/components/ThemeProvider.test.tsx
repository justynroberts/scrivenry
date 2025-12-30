import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { ThemeProvider, themeScript } from '@/components/ThemeProvider'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock matchMedia
const mockMatchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}))

window.matchMedia = mockMatchMedia

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    document.documentElement.className = ''
    document.body.className = ''
  })

  describe('rendering', () => {
    it('should render children', () => {
      render(
        <ThemeProvider>
          <div>Test Content</div>
        </ThemeProvider>
      )
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })

  describe('theme initialization', () => {
    it('should add dark class by default when no theme saved', () => {
      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should apply saved dark theme', () => {
      localStorageMock.getItem.mockReturnValueOnce('dark')
      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should not add any theme class for light theme', () => {
      localStorageMock.getItem.mockReturnValueOnce('light')
      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })

    it('should apply sepia theme', () => {
      localStorageMock.getItem.mockReturnValueOnce('sepia')
      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )
      expect(document.documentElement.classList.contains('sepia')).toBe(true)
    })

    it('should apply nord theme', () => {
      localStorageMock.getItem.mockReturnValueOnce('nord')
      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )
      expect(document.documentElement.classList.contains('nord')).toBe(true)
    })

    it('should apply dracula theme', () => {
      localStorageMock.getItem.mockReturnValueOnce('dracula')
      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )
      expect(document.documentElement.classList.contains('dracula')).toBe(true)
    })
  })

  describe('system theme', () => {
    it('should apply dark when system prefers dark', () => {
      localStorageMock.getItem.mockReturnValueOnce('system')
      mockMatchMedia.mockReturnValueOnce({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should not apply dark when system prefers light', () => {
      localStorageMock.getItem.mockReturnValueOnce('system')
      mockMatchMedia.mockReturnValueOnce({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('font initialization', () => {
    it('should apply default inter font when no font saved', () => {
      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )
      expect(document.body.classList.contains('font-inter')).toBe(true)
    })

    it('should apply saved font', () => {
      localStorageMock.getItem
        .mockReturnValueOnce(null) // theme
        .mockReturnValueOnce('merriweather') // font

      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )
      expect(document.body.classList.contains('font-merriweather')).toBe(true)
    })
  })

  describe('cleanup', () => {
    it('should remove theme classes before applying new theme', () => {
      document.documentElement.classList.add('sepia')
      localStorageMock.getItem.mockReturnValueOnce('dark')

      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )

      expect(document.documentElement.classList.contains('sepia')).toBe(false)
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should remove font classes before applying new font', () => {
      document.body.classList.add('font-roboto')
      localStorageMock.getItem
        .mockReturnValueOnce(null)
        .mockReturnValueOnce('lato')

      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )

      expect(document.body.classList.contains('font-roboto')).toBe(false)
      expect(document.body.classList.contains('font-lato')).toBe(true)
    })
  })
})

describe('themeScript', () => {
  it('should be a non-empty string', () => {
    expect(typeof themeScript).toBe('string')
    expect(themeScript.length).toBeGreaterThan(0)
  })

  it('should contain theme logic', () => {
    expect(themeScript).toContain('localStorage.getItem')
    expect(themeScript).toContain('theme')
    expect(themeScript).toContain('dark')
  })

  it('should be a self-executing function', () => {
    expect(themeScript).toMatch(/^\s*\(function\(\)/)
    expect(themeScript).toMatch(/\}\)\(\);\s*$/)
  })

  it('should handle errors gracefully', () => {
    expect(themeScript).toContain('try')
    expect(themeScript).toContain('catch')
  })
})
