// MIT License - Copyright (c) fintonlabs.com

import { NextRequest } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { pageEvents } from '@/lib/events'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { user } = await validateRequest()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id: pageId } = await params

  // Create a TransformStream for SSE
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  // Send initial connection message
  const sendEvent = async (data: object) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
    } catch {
      // Client disconnected
    }
  }

  // Send heartbeat to keep connection alive
  const heartbeat = setInterval(async () => {
    try {
      await writer.write(encoder.encode(`: heartbeat\n\n`))
    } catch {
      clearInterval(heartbeat)
    }
  }, 30000)

  // Subscribe to page updates
  const unsubscribe = pageEvents.subscribe(pageId, async (data) => {
    await sendEvent({ type: 'update', ...data })
  })

  // Send connected event
  sendEvent({ type: 'connected', pageId })

  // Cleanup on disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(heartbeat)
    unsubscribe()
    writer.close()
  })

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
