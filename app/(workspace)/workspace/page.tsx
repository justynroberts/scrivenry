import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function WorkspacePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Welcome to Scrivenry</h1>
      <p className="text-muted-foreground mb-6">
        Get started by creating your first page
      </p>
      <Button asChild>
        <Link href="/">
          <Plus className="h-4 w-4 mr-2" />
          Create a page
        </Link>
      </Button>
    </div>
  )
}
