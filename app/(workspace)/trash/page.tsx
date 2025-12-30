import { db } from '@/lib/db'
import { pages } from '@/lib/db/schema'
import { isNotNull, desc } from 'drizzle-orm'
import { TrashList } from './trash-list'

export default async function TrashPage() {
  const deletedPages = await db.query.pages.findMany({
    where: isNotNull(pages.deletedAt),
    orderBy: [desc(pages.deletedAt)],
  })

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <h1 className="text-3xl font-bold mb-2">Trash</h1>
      <p className="text-muted-foreground mb-8">
        Pages in trash will be permanently deleted after 30 days.
      </p>
      <TrashList pages={deletedPages} />
    </div>
  )
}
