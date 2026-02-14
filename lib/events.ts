// MIT License - Copyright (c) fintonlabs.com

// Simple in-memory event emitter for real-time page updates
// Uses SSE (Server-Sent Events) for push notifications

type PageUpdateHandler = (data: { pageId: string; updatedAt: string }) => void

class PageEventEmitter {
  private listeners: Map<string, Set<PageUpdateHandler>> = new Map()

  subscribe(pageId: string, handler: PageUpdateHandler): () => void {
    if (!this.listeners.has(pageId)) {
      this.listeners.set(pageId, new Set())
    }
    this.listeners.get(pageId)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.listeners.get(pageId)?.delete(handler)
      if (this.listeners.get(pageId)?.size === 0) {
        this.listeners.delete(pageId)
      }
    }
  }

  emit(pageId: string, updatedAt: string): void {
    const handlers = this.listeners.get(pageId)
    if (handlers) {
      handlers.forEach(handler => handler({ pageId, updatedAt }))
    }
  }
}

// Singleton instance
export const pageEvents = new PageEventEmitter()
