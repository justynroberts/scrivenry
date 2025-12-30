import { redirect } from 'next/navigation'
import { validateRequest } from '@/lib/auth'
import Link from 'next/link'
import { User, Key, Palette, Bot, Book, Building2 } from 'lucide-react'

export default async function SettingsPage() {
  const { user } = await validateRequest()

  if (!user) {
    redirect('/login')
  }

  const settingsLinks = [
    {
      href: '/settings/profile',
      icon: User,
      title: 'Profile',
      description: 'Manage your account settings',
    },
    {
      href: '/settings/workspace',
      icon: Building2,
      title: 'Workspace',
      description: 'Rename workspace and export data',
    },
    {
      href: '/settings/api-keys',
      icon: Key,
      title: 'API Keys',
      description: 'Manage API keys for programmatic access',
    },
    {
      href: '/settings/appearance',
      icon: Palette,
      title: 'Appearance',
      description: 'Customize the look and feel',
    },
    {
      href: '/settings/ai',
      icon: Bot,
      title: 'AI Settings',
      description: 'Configure AI providers and models',
    },
    {
      href: '/settings/api-docs',
      icon: Book,
      title: 'API Documentation',
      description: 'API reference and examples',
    },
  ]

  return (
    <div className="max-w-2xl mx-auto px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-4">
        {settingsLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="font-medium">{link.title}</h2>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
