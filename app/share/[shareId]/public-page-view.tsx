// MIT License - Copyright (c) fintonlabs.com

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Editor } from '@/components/editor/Editor'
import type { Page } from '@/lib/db/schema'

interface PublicPageViewProps {
  page: Page
}

export function PublicPageView({ page }: PublicPageViewProps) {
  const [contentWidth, setContentWidth] = useState<string>('max-w-3xl')

  // Apply theme from localStorage (for consistency if user visits)
  useEffect(() => {
    const widthMap: Record<string, string> = {
      'narrow': 'max-w-2xl',
      'medium': 'max-w-3xl',
      'wide': 'max-w-5xl',
      'full': 'max-w-none',
    }
    const saved = localStorage.getItem('contentWidth')
    if (saved && widthMap[saved]) {
      setContentWidth(widthMap[saved])
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Cover */}
      {page.cover ? (
        <div
          className={`h-48 bg-cover bg-center ${
            page.cover.startsWith('animated:')
              ? `cover-${page.cover.replace('animated:', '')}`
              : ''
          }`}
          style={
            page.cover.startsWith('animated:')
              ? undefined
              : {
                  background: page.cover.startsWith('linear-gradient') || page.cover.startsWith('#')
                    ? page.cover
                    : `url(${page.cover}) center/cover`,
                }
          }
        />
      ) : null}

      <div className={`${contentWidth} mx-auto px-8 py-6 ${page.cover ? '-mt-16 relative z-10' : ''}`}>
        {/* Shared badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Shared page</span>
          </div>
          <Link
            href="/"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Try Scrivenry
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex items-start gap-4 mb-6">
          <span className="text-4xl">{page.icon || '📄'}</span>
          <div className="flex-1">
            <h1 className="text-4xl font-bold">{page.title}</h1>
          </div>
        </div>

        {/* Editor (read-only) */}
        <Editor
          content={page.content as Record<string, unknown> | undefined}
          editable={false}
        />

        {/* Footer */}
        <div className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            Powered by{' '}
            <Link href="/" className="text-primary hover:underline">
              Scrivenry
            </Link>
            {' '}— Knowledge. Free. Always.
          </p>
        </div>
      </div>
    </div>
  )
}
