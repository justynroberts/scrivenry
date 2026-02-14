'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, X, Inbox, Archive, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NotificationCard } from './NotificationCard'
import { NotificationBadge } from './NotificationBadge'
import { cn } from '@/lib/utils'
import type { Notification } from '@/lib/db/schema'

type TabType = 'all' | 'unread' | 'archived'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const status = activeTab === 'all' ? 'active' : activeTab
      const res = await fetch(`/api/notifications?status=${status}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unread_count)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [isOpen, fetchNotifications])

  const handleAction = async (id: string, action: string, data?: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      })
      if (res.ok) {
        await fetchNotifications()
      }
    } catch (error) {
      console.error('Failed to update notification:', error)
    }
  }

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All', icon: Inbox },
    { id: 'unread', label: 'Unread', icon: Bell },
    { id: 'archived', label: 'Archived', icon: Archive },
  ]

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full w-80 bg-card border-l border-border shadow-lg z-50',
        'transform transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h2 className="font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm transition-colors',
              activeTab === tab.id
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-120px)]">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <CheckCircle className="w-8 h-8 mb-2" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

// Export a toggle button component
interface NotificationToggleProps {
  onClick: () => void
  unreadCount: number
}

export function NotificationToggle({ onClick, unreadCount }: NotificationToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={onClick}
      title="Notifications (Cmd+Shift+N)"
    >
      <Bell className="w-5 h-5" />
      <NotificationBadge count={unreadCount} />
    </Button>
  )
}
