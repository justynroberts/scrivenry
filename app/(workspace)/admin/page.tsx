import { redirect } from 'next/navigation'
import { validateRequest } from '@/lib/auth'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export const metadata = {
  title: 'Admin Panel — Scrivenry',
}

export default async function AdminPage() {
  const { user } = await validateRequest()

  if (!user) {
    redirect('/login')
  }

  if (!user.isAdmin) {
    redirect('/workspace')
  }

  return (
    <AdminDashboard
      userId={user.id}
      userEmail={user.email}
    />
  )
}
