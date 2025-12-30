import { redirect } from 'next/navigation'
import { validateRequest } from '@/lib/auth'
import { ProfileForm } from './profile-form'

export default async function ProfilePage() {
  const { user } = await validateRequest()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      <ProfileForm user={user} />
    </div>
  )
}
