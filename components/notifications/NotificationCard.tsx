'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Clock, Check, Archive, ExternalLink, Play, FileText, Bell, Info, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Notification } from '@/lib/db/schema'

interface NotificationCardProps {
  notification: Notification
  onAction: (id: string, action: string, data?: Record<string, unknown>) => Promise<void>
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'page_created':
    case 'page_updated':
      return FileText
    case 'system':
      return Info
    case 'alert':
      return AlertCircle
    case 'feature':
      return Sparkles
    default:
      return Bell
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case 'page_created':
      return 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30'
    case 'page_updated':
      return 'from-blue-500/20 to-blue-500/5 border-blue-500/30'
    case 'system':
      return 'from-slate-500/20 to-slate-500/5 border-slate-500/30'
    case 'alert':
      return 'from-red-500/20 to-red-500/5 border-red-500/30'
    case 'feature':
      return 'from-purple-500/20 to-purple-500/5 border-purple-500/30'
    default:
      return 'from-primary/20 to-primary/5 border-primary/30'
  }
}

function getIconColor(type: string) {
  switch (type) {
    case 'page_created':
      return 'text-emerald-500 bg-emerald-500/20'
    case 'page_updated':
      return 'text-blue-500 bg-blue-500/20'
    case 'system':
      return 'text-slate-400 bg-slate-500/20'
    case 'alert':
      return 'text-red-500 bg-red-500/20'
    case 'feature':
      return 'text-purple-500 bg-purple-500/20'
    default:
      return 'text-primary bg-primary/20'
  }
}

function getSnoozeOptions(): { label: string; getTime: () => Date }[] {
  return [
    {
      label: '1 hour',
      getTime: () => new Date(Date.now() + 60 * 60 * 1000),
    },
    {
      label: '4 hours',
      getTime: () => new Date(Date.now() + 4 * 60 * 60 * 1000),
    },
    {
      label: 'End of today',
      getTime: () => {
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        return today
      },
    },
  ]
}

function formatTimeAgo(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
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
  const [isFadingOut, setIsFadingOut] = useState(false)

  const handleAction = async (action: string, data?: Record<string, unknown>) => {
    setIsLoading(true)
    try {
      await onAction(notification.id, action, data)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFadeAction = async (action: string) => {
    setIsFadingOut(true)
    // Wait for fade animation (3s), then perform action
    setTimeout(async () => {
      await handleAction(action)
    }, 3000)
  }

  const handleSnooze = async (getTime: () => Date) => {
    const snoozedUntil = getTime()
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
  const Icon = getNotificationIcon(notification.type)
  const colorClass = getNotificationColor(notification.type)
  const iconColorClass = getIconColor(notification.type)

  return (
    <div
      className={cn(
        'mx-2 my-2 p-4 rounded-xl border bg-gradient-to-br',
        'hover:scale-[1.02] hover:shadow-lg',
        colorClass,
        notification.status === 'unread' && 'ring-2 ring-primary/20 shadow-md',
        isArchived && 'opacity-50 grayscale',
        isFadingOut
          ? 'transition-all duration-[3000ms] ease-out opacity-0 scale-95 translate-x-4'
          : 'transition-all duration-300'
      )}
      style={isFadingOut ? { pointerEvents: 'none' } : undefined}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        <div className={cn(
          'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
          'transition-transform duration-300 hover:scale-110',
          iconColorClass
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div
          className={cn('flex-1 cursor-pointer group', notification.linkUrl && 'hover:underline')}
          onClick={handleClick}
        >
          <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{notification.title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(notification.createdAt)}</p>
        </div>
        <div className="flex items-center gap-1">
          {notification.status === 'snoozed' && notification.snoozedUntil && (
            <span className="text-xs text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              {new Date(notification.snoozedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Message - Markdown Supported */}
      {notification.message && (
        <div className="text-sm text-muted-foreground mb-3 prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-a:text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {notification.message}
          </ReactMarkdown>
        </div>
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
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/50">
        {/* Snooze */}
        <Popover open={snoozeOpen} onOpenChange={setSnoozeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs rounded-lg hover:bg-amber-500/20 hover:text-amber-500 transition-colors"
              disabled={isLoading || isArchived}
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Snooze
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-1.5" align="start">
            <div className="space-y-0.5">
              {getSnoozeOptions().map((option) => (
                <Button
                  key={option.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-xs rounded-lg hover:bg-amber-500/20 hover:text-amber-500"
                  onClick={() => handleSnooze(option.getTime)}
                  disabled={isLoading}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Accept */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 text-xs rounded-lg transition-colors",
            notification.status === 'accepted'
              ? "bg-emerald-500/20 text-emerald-500"
              : "hover:bg-emerald-500/20 hover:text-emerald-500"
          )}
          onClick={() => handleFadeAction('accept')}
          disabled={isLoading || isArchived || notification.status === 'accepted' || isFadingOut}
        >
          <Check className="w-3.5 h-3.5 mr-1.5" />
          {notification.status === 'accepted' ? 'Accepted' : 'Accept'}
        </Button>

        {/* Archive / Unarchive */}
        {isArchived ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs rounded-lg hover:bg-blue-500/20 hover:text-blue-500 transition-colors ml-auto"
            onClick={() => handleAction('unarchive')}
            disabled={isLoading || isFadingOut}
          >
            <Archive className="w-3.5 h-3.5 mr-1.5" />
            Restore
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs rounded-lg hover:bg-slate-500/20 hover:text-slate-400 transition-colors ml-auto"
            onClick={() => handleFadeAction('archive')}
            disabled={isLoading || isFadingOut}
          >
            <Archive className="w-3.5 h-3.5 mr-1.5" />
            Archive
          </Button>
        )}
      </div>
    </div>
  )
}
