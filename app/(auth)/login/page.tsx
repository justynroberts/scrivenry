'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string>('')

  useEffect(() => {
    // Fetch CSRF token on mount
    apiFetch('/api/auth/csrf')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken))
      .catch(() => setError('Failed to initialize. Please refresh the page.'))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, csrfToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many login attempts. Please try again in 15 minutes.')
        } else {
          setError(data.error || 'Failed to login')
        }
        return
      }

      // Cookie is set by the server (httpOnly)
      // Just navigate - browser handles the cookie automatically
      router.push('/')
      router.refresh()
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="flex items-center">
            <FileText className="h-10 w-10 text-primary" />
            <span className="ml-2 text-2xl font-bold">Scrivenry</span>
          </div>
          <span className="text-sm text-muted-foreground mt-1">Knowledge. Free. Always.</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading || !csrfToken}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Do not have an account?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>

        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          A{' '}
          <a
            href="https://www.fintonlabs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Fintonlabs
          </a>
          {' '}Product
        </p>
      </div>
    </div>
  )
}
