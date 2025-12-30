import type { Metadata } from 'next'
import { Space_Grotesk, Spline_Sans_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { ThemeProvider, themeScript } from '@/components/ThemeProvider'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

const splineSansMono = Spline_Sans_Mono({
  subsets: ['latin'],
  variable: '--font-spline-sans-mono',
})

export const metadata: Metadata = {
  title: 'Scrivenry',
  description: 'Knowledge. Free. Always. - Self-hosted documentation platform with block-based editing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${spaceGrotesk.variable} ${splineSansMono.variable} font-sans antialiased`}>
        <Providers>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
