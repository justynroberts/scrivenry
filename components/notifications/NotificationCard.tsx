'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Check, Archive, X, ExternalLink, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Notification } from '@/lib/db/schema'

interface NotificationCardProps {
  notification: Notification
  onAction: (id: string, action: string, data?: Record<string, unknown>) => Promise<void>
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

function isEmbeddableVideo(url: string): boolean {
  if (!url) return false
  const embeddable = ['.mp4', '.webm', '.ogg']
  return embeddable.some(ext => url.toLowerCase().includes(ext))
}

export function NotificationCard({ notification, onAction }: NotificationCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const [snoozeDate, setSnoozeDate] = useState('')
  const [snoozeTime, setSnoozeTime] = useState('')

  const handleAction = async (action: string, data?: Record<string, unknown>) => {
    setIsLoading(true)
    try {
      await onAction(notification.id, action, data)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSnooze = async () => {
    if (!snoozeDate || !snoozeTime) return
    const snoozedUntil = new Date(`${snoozeDate}T${snoozeTime}`)
    await handleAction('snooze', { snoozedUntil: snoozedUntil.toISOString() })
    setSnoozeOpen(false)
  }

  const handleClick = () => {
    if (notification.linkUrl) {
      if (notification.status === 'unread') {
        handleAction('read')
      }
      router.push(notification.linkUrl)
    }
  }

  const isArchived = !!notification.archivedAt

  return (
    <div
      className={cn(
        'p-4 border-b border-border hover:bg-accent/50 transition-colors',
        notification.status === 'unread' && 'bg-accent/20',
        isArchived && 'opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div
          className={cn('flex-1 cursor-pointer', notification.linkUrl && 'hover:underline')}
          onClick={handleClick}
        >
          <h4 className="font-medium text-sm">{notification.title}</h4>
          <p className="text-xs text-muted-foreground">{formatTimeAgo(notification.createdAt)}</p>
        </div>
        <div className="flex items-center gap-1">
          {notification.status === 'snoozed' && notification.snoozedUntil && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(notification.snoozedUntil).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Message */}
      {notification.message && (
        <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>
      )}

      {/* Rich Content - Image */}
      {notification.imageUrl && (
        <div className="mb-3">
          <img
            src={notification.imageUrl}
            alt=""
            className="rounded-lg max-h-48 w-auto object-cover"
          />
        </div>
      )}

      {/* Rich Content - Video */}
      {notification.videoUrl && (
        <div className="mb-3">
          {isEmbeddableVideo(notification.videoUrl) ? (
            <video
              src={notification.videoUrl}
              controls
              className="rounded-lg max-h-48 w-full"
            />
          ) : (
            <a
              href={notification.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Play className="w-4 h-4" />
              Watch Video
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Link */}
      {notification.linkUrl && notification.linkText && (
        <a
          href={notification.linkUrl}
          className="text-sm text-primary hover:underline flex items-center gap-1 mb-3"
          onClick={(e) => {
            e.preventDefault()
            handleClick()
          }}
        >
          {notification.linkText}
          <ExternalLink className="w-3 h-3" />
        </a>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-2">
        {/* Snooze */}
        <Popover open={snoozeOpen} onOpenChange={setSnoozeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={isLoading || isArchived}
            >
              <Clock className="w-3 h-3 mr-1" />
              Snooze
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3">
            <div className="space-y-3">
              <p className="text-sm font-medium">Snooze until</p>
              <input
                type="date"
                value={snoozeDate}
                onChange={(e) => setSnoozeDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-2 py-1 text-sm border rounded bg-background"
              />
              <input
                type="time"
                value={snoozeTime}
                onChange={(e) => setSnoozeTime(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded bg-background"
              />
              <Button
                size="sm"
                className="w-full"
                onClick={handleSnooze}
                disabled={!snoozeDate || !snoozeTime}
              >
                Confirm
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Accept */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => handleAction('accept')}
          disabled={isLoading || isArchived || notification.status === 'accepted'}
        >
          <Check className="w-3 h-3 mr-1" />
          Accept
        </Button>

        {/* Archive / Unarchive */}
        {isArchived ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleAction('unarchive')}
            disabled={isLoading}
          >
            <Archive className="w-3 h-3 mr-1" />
            Unarchive
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleAction('archive')}
            disabled={isLoading}
          >
            <Archive className="w-3 h-3 mr-1" />
            Archive
          </Button>
        )}

        {/* Dismiss (mark as read) */}
        {notification.status === 'unread' && !isArchived && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs ml-auto"
            onClick={() => handleAction('read')}
            disabled={isLoading}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  )
}
