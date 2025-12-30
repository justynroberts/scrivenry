import { NextResponse } from 'next/server'
import { PAGE_TEMPLATES } from '@/lib/templates'

export async function GET() {
  return NextResponse.json({ templates: PAGE_TEMPLATES })
}
