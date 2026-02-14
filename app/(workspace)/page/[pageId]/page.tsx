import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { pages, favorites, pageTags, tags } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { validateRequest } from '@/lib/auth'
import { PageEditor } from './page-editor'

interface PageProps {
  params: Promise<{
    pageId: string
  }>
}

export default async function Page({ params }: PageProps) {
  try {
    const { pageId } = await params
    const { user } = await validateRequest()

    const page = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
    })

    if (!page || page.deletedAt) {
      notFound()
    }

  // Check if favorited
  let isFavorite = false
  if (user) {
    const favorite = await db.query.favorites.findFirst({
      where: and(
        eq(favorites.userId, user.id),
        eq(favorites.pageId, pageId)
      ),
    })
    isFavorite = !!favorite
  }

  // Get page tags
  const pageTagLinks = await db.query.pageTags.findMany({
    where: eq(pageTags.pageId, pageId),
  })
  const pageTagsList = await Promise.all(
    pageTagLinks.map(async (pt) => {
      return db.query.tags.findFirst({
        where: eq(tags.id, pt.tagId),
      })
    })
  )
  const initialTags = pageTagsList.filter(Boolean) as typeof tags.$inferSelect[]

  // Get breadcrumb
  const breadcrumb: { id: string; title: string }[] = []
  let currentPage = page

  while (currentPage.parentId) {
    const parent = await db.query.pages.findFirst({
      where: eq(pages.id, currentPage.parentId),
    })
    if (parent) {
      breadcrumb.unshift({ id: parent.id, title: parent.title })
      currentPage = parent
    } else {
      break
    }
  }

  // Serialize dates for client component
  const serializedPage = {
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    deletedAt: null as string | null, // Always null here since we check deletedAt above
  }

  const serializedTags = initialTags.map(tag => ({
    ...tag,
    createdAt: tag.createdAt.toISOString(),
  }))

  return (
    <PageEditor
      page={serializedPage as any}
      breadcrumb={breadcrumb}
      isFavorite={isFavorite}
      initialTags={serializedTags as any}
    />
  )
  } catch (error) {
    console.error('Page render error:', error)
    throw error
  }
}
