import { redirect } from 'next/navigation'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { pages, workspaces } from '@/lib/db/schema'
import { isNull } from 'drizzle-orm'
import { WorkspaceLayout } from './workspace-layout'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await validateRequest()

  if (!user) {
    redirect('/login')
  }

  const workspace = await db.query.workspaces.findFirst()

  if (!workspace) {
    redirect('/login')
  }

  const allPages = await db.query.pages.findMany({
    where: isNull(pages.deletedAt),
    orderBy: (pages, { asc }) => [asc(pages.position)],
  })

  return (
    <WorkspaceLayout
      pages={allPages}
      workspaceName={workspace.name}
      workspaceId={workspace.id}
    >
      {children}
    </WorkspaceLayout>
  )
}
