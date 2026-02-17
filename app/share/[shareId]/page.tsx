// MIT License - Copyright (c) fintonlabs.com

import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { publicShares, pages } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { PublicPageView } from './public-page-view'

interface Props {
  params: Promise<{ shareId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { shareId } = await params

  const share = await db.query.publicShares.findFirst({
    where: eq(publicShares.id, shareId),
  })

  if (!share) {
    return { title: 'Page Not Found' }
  }

  const page = await db.query.pages.findFirst({
    where: and(
      eq(pages.id, share.pageId),
      isNull(pages.deletedAt)
    ),
  })

  if (!page) {
    return { title: 'Page Not Found' }
  }

  return {
    title: `${page.title} - Scrivenry`,
    description: `Shared page: ${page.title}`,
  }
}

export default async function SharedPage({ params }: Props) {
  const { shareId } = await params

  // Find the share
  const share = await db.query.publicShares.findFirst({
    where: eq(publicShares.id, shareId),
  })

  if (!share) {
    notFound()
  }

  // Check if expired
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Link Expired</h1>
          <p className="text-muted-foreground">This shared link has expired.</p>
        </div>
      </div>
    )
  }

  // Get the page (ensure not deleted)
  const page = await db.query.pages.findFirst({
    where: and(
      eq(pages.id, share.pageId),
      isNull(pages.deletedAt)
    ),
  })

  if (!page) {
    notFound()
  }

  return <PublicPageView page={page} />
}
