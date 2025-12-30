'use client'

import { useEffect } from 'react'

const THEME_CLASSES = ['dark', 'sepia', 'nord', 'dracula', 'solarized-dark', 'solarized-light', 'ocean', 'forest', 'rose', 'midnight']
const FONT_CLASSES = ['font-inter', 'font-merriweather', 'font-source-sans', 'font-roboto', 'font-open-sans', 'font-lato', 'font-nunito', 'font-poppins', 'font-space-grotesk', 'font-system']

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load and apply saved theme
    const savedTheme = localStorage.getItem('theme')
    const root = document.documentElement

    // Remove all theme classes first
    THEME_CLASSES.forEach(cls => root.classList.remove(cls))

    if (savedTheme) {
      if (savedTheme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (systemDark) root.classList.add('dark')
      } else if (savedTheme === 'light') {
        // Light is default, no class needed
      } else if (THEME_CLASSES.includes(savedTheme)) {
        root.classList.add(savedTheme)
      }
    } else {
      // Default to dark if no theme saved
      root.classList.add('dark')
    }

    // Load and apply saved font
    const savedFont = localStorage.getItem('font')
    const body = document.body

    // Remove all font classes first
    FONT_CLASSES.forEach(cls => body.classList.remove(cls))

    if (savedFont) {
      body.classList.add(`font-${savedFont}`)
    } else {
      body.classList.add('font-inter')
    }

    // Listen for system theme changes if using system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const currentTheme = localStorage.getItem('theme')
      if (currentTheme === 'system') {
        THEME_CLASSES.forEach(cls => root.classList.remove(cls))
        if (mediaQuery.matches) {
          root.classList.add('dark')
        }
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return <>{children}</>
}

// Script to run before React hydration to prevent flash
export const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    var root = document.documentElement;
    var themeClasses = ['dark', 'sepia', 'nord', 'dracula', 'solarized-dark', 'solarized-light', 'ocean', 'forest', 'rose', 'midnight'];

    themeClasses.forEach(function(cls) { root.classList.remove(cls); });

    if (theme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      }
    } else if (theme === 'light') {
      // Light is default
    } else if (theme && themeClasses.indexOf(theme) !== -1) {
      root.classList.add(theme);
    } else {
      root.classList.add('dark');
    }

    var font = localStorage.getItem('font');
    if (font) {
      document.body.classList.add('font-' + font);
    }
  } catch (e) {}
})();
`
