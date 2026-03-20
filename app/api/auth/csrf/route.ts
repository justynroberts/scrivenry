import { NextResponse } from 'next/server'
import { generateCSRFToken } from '@/lib/auth'

export async function GET() {
  const token = generateCSRFToken()
  return NextResponse.json({ csrfToken: token })
}
