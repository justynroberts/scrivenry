import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // The middleware runs on every request
  // We can't intercept cookies set on the client, but we can set our own
  
  // For now, just pass through
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|static|.*\\.png).*)'],
}
