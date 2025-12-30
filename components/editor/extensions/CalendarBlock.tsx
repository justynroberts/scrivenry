'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CalendarEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD format
  color: string
}

interface CalendarBlockComponentProps {
  node: {
    attrs: {
      events?: CalendarEvent[]
      title?: string
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  deleteNode: () => void
}

const generateId = () => Math.random().toString(36).substr(2, 9)

const colors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-pink-500',
]

const CalendarBlockComponent = ({ node, updateAttributes, deleteNode }: CalendarBlockComponentProps) => {
  const events: CalendarEvent[] = node.attrs.events || []
  const title = node.attrs.title || 'Calendar'

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date)
  }

  const addEvent = () => {
    if (!selectedDate || !newEventTitle.trim()) return
    const newEvent: CalendarEvent = {
      id: generateId(),
      title: newEventTitle.trim(),
      date: selectedDate,
      color: colors[events.length % colors.length],
    }
    updateAttributes({ events: [...events, newEvent] })
    setNewEventTitle('')
  }

  const deleteEvent = (eventId: string) => {
    updateAttributes({ events: events.filter(e => e.id !== eventId) })
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const today = new Date()
  const todayString = formatDate(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <NodeViewWrapper>
      <div
        className="my-4 rounded-lg border border-border overflow-hidden"
        contentEditable={false}
        data-testid="calendar-block"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            {editingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => updateAttributes({ title: e.target.value })}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                className="px-2 py-1 text-sm font-medium bg-background border rounded"
                autoFocus
              />
            ) : (
              <span
                className="font-medium cursor-pointer hover:text-primary"
                onClick={() => setEditingTitle(true)}
              >
                {title}
              </span>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={deleteNode}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button size="sm" variant="ghost" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-medium">
              {monthNames[month]} {year}
            </h3>
            <Button size="sm" variant="ghost" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs text-muted-foreground py-2 font-medium">
                {day}
              </div>
            ))}

            {/* Empty cells for start of month */}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateString = formatDate(year, month, day)
              const dayEvents = getEventsForDate(dateString)
              const isToday = dateString === todayString
              const isSelected = dateString === selectedDate

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(dateString)}
                  className={`h-20 p-1 border rounded cursor-pointer transition-colors ${
                    isToday ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
                  } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className={`text-xs font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs px-1 rounded truncate text-white ${event.color}`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Selected Date Events */}
          {selectedDate && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">
                Events for {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}
              </h4>
              <div className="space-y-2">
                {getEventsForDate(selectedDate).map(event => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 p-2 rounded bg-muted/50"
                  >
                    <div className={`w-2 h-2 rounded-full ${event.color}`} />
                    <span className="flex-1 text-sm">{event.title}</span>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="p-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Add Event */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addEvent()}
                    placeholder="New event..."
                    className="flex-1 px-3 py-2 text-sm rounded border bg-background"
                  />
                  <Button size="sm" onClick={addEvent}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const CalendarBlock = Node.create({
  name: 'calendarBlock',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      events: {
        default: null,
        parseHTML: element => JSON.parse(element.getAttribute('data-events') || 'null'),
        renderHTML: attributes => ({ 'data-events': JSON.stringify(attributes.events) }),
      },
      title: {
        default: 'Calendar',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="calendar-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'calendar-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalendarBlockComponent)
  },
})
