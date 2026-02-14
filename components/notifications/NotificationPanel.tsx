'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, X, Inbox, Archive, CheckCircle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NotificationCard } from './NotificationCard'
import { NotificationBadge } from './NotificationBadge'
import { cn } from '@/lib/utils'
import type { Notification } from '@/lib/db/schema'

// Helper to get/set auto-open preference
export function getAutoOpenEnabled(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem('notifications_auto_open') !== 'false'
}

export function setAutoOpenEnabled(enabled: boolean): void {
  localStorage.setItem('notifications_auto_open', enabled ? 'true' : 'false')
}

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
  const [autoOpen, setAutoOpen] = useState(true)

  // Load auto-open preference
  useEffect(() => {
    setAutoOpen(getAutoOpenEnabled())
  }, [])

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
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-96 bg-gradient-to-b from-card to-card/95 border-l border-border/50 shadow-2xl z-50',
          'transform transition-all duration-500 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Notifications</h2>
              {unreadCount > 0 && (
                <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
              )}
            </div>
          </div>
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" title="Settings">
                <Settings className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-3">
                <p className="text-sm font-medium">Notification Settings</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoOpen}
                    onChange={(e) => {
                      setAutoOpen(e.target.checked)
                      setAutoOpenEnabled(e.target.checked)
                    }}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm">Auto-open on new</span>
                </label>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

        {/* Tabs */}
        <div className="flex bg-muted/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'text-primary bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-160px)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <CheckCircle className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs mt-1">No notifications to show</p>
            </div>
          ) : (
            <div className="py-2">
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
    </>
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
      className={cn(
        "relative w-10 h-10 rounded-xl transition-all duration-300",
        "hover:bg-primary/10 hover:scale-105",
        unreadCount > 0 && "bg-primary/5"
      )}
      onClick={onClick}
      title="Notifications (Cmd+Shift+N)"
    >
      <Bell className={cn(
        "w-5 h-5 transition-colors",
        unreadCount > 0 && "text-primary"
      )} />
      <NotificationBadge count={unreadCount} />
    </Button>
  )
}
