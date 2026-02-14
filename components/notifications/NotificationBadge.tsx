'use client'

import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  count: number
  className?: string
}

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  if (count <= 0) return null

  return (
    <>
      {/* Ping animation */}
      <span className="absolute -top-1 -right-1 flex h-5 w-5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span
          className={cn(
            'relative inline-flex items-center justify-center rounded-full',
            'h-5 w-5 text-[10px] font-bold',
            'bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg',
            className
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      </span>
    </>
  )
}
