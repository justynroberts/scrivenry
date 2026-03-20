'use client'

import { Users, FileText, Folder, HardDrive, Activity } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalPages: number
  totalWorkspaces: number
  activeWorkspaces: number
  storageUsed: string
}

interface StatsCardsProps {
  stats: Stats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      icon: Users,
      label: 'Total Users',
      value: stats.totalUsers.toString(),
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      icon: FileText,
      label: 'Total Pages',
      value: stats.totalPages.toString(),
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      icon: Folder,
      label: 'Workspaces',
      value: stats.totalWorkspaces.toString(),
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      icon: Activity,
      label: 'Active Members',
      value: stats.activeWorkspaces.toString(),
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
    {
      icon: HardDrive,
      label: 'Storage Used',
      value: stats.storageUsed,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map(({ icon: Icon, label, value, color, bg }) => (
        <div
          key={label}
          className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3"
        >
          <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
