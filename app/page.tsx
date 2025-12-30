import { redirect } from 'next/navigation'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { pages, workspaces } from '@/lib/db/schema'
import { desc, isNull } from 'drizzle-orm'

export default async function HomePage() {
  const { user } = await validateRequest()

  if (!user) {
    redirect('/login')
  }

  // Get the first workspace and redirect to the first page
  const workspace = await db.query.workspaces.findFirst()

  if (!workspace) {
    redirect('/login')
  }

  const firstPage = await db.query.pages.findFirst({
    where: isNull(pages.deletedAt),
    orderBy: [desc(pages.createdAt)],
  })

  if (firstPage) {
    redirect(`/page/${firstPage.id}`)
  }

  // No pages exist, redirect to workspace home
  redirect('/workspace')
}
