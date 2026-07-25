import { useEffect, useRef } from 'react'
import { X, Bell } from 'lucide-react'
import { cn } from '@/lib/cn'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'

export interface NotificationItem {
  id: string
  title: string
  body?: string
  timestamp: string
  read: boolean
}

export interface NotificationPanelProps {
  open: boolean
  onClose: () => void
  notifications: NotificationItem[]
  onMarkAllRead?: () => void
  onItemClick?: (id: string) => void
  /** Anchor reference element — panel will float below it */
  className?: string
}

/** Notification Panel — design_system.md §8.16 */
export function NotificationPanel({
  open,
  onClose,
  notifications,
  onMarkAllRead,
  onItemClick,
  className,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open, onClose])

  // Close on Esc
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <GlassSurface
      ref={panelRef as React.Ref<HTMLElement>}
      elevation="dropdown"
      className={cn(
        'absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-xl',
        className,
      )}
      role="dialog"
      aria-label="Notifications"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon icon={Bell} size="md" className="text-brand-primary" />
          <Text variant="h4" className="text-neutral-800">
            Notifications
          </Text>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger-default px-1.5 text-[10px] font-semibold tabular-nums text-neutral-0">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notifications"
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md text-neutral-500',
            'hover:bg-hover-surface hover:text-neutral-800',
            'focus:outline-none focus:shadow-[var(--color-focus-ring)]',
            'transition-colors duration-[var(--motion-fast)]',
          )}
        >
          <Icon icon={X} size="sm" />
        </button>
      </div>

      {/* List */}
      <ul className="max-h-[320px] divide-y divide-border-default overflow-y-auto">
        {notifications.length === 0 ? (
          <li className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Icon icon={Bell} size="xl" className="text-neutral-300" />
            <Text variant="body-sm" className="text-neutral-500">
              You're all caught up
            </Text>
          </li>
        ) : (
          notifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => onItemClick?.(n.id)}
                className={cn(
                  'flex w-full items-start gap-3 px-4 py-3 text-left',
                  'transition-colors duration-[var(--motion-fast)] hover:bg-hover-surface',
                  'focus:outline-none focus:bg-hover-surface',
                )}
              >
                {/* Unread dot */}
                <div className="mt-1.5 flex w-2 shrink-0 items-start justify-center">
                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-brand-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-body-md leading-snug text-neutral-800',
                      !n.read && 'font-medium',
                    )}
                  >
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 truncate text-body-sm text-neutral-600">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-1 text-mono-sm text-neutral-500">{n.timestamp}</p>
                </div>
              </button>
            </li>
          ))
        )}
      </ul>

      {/* Footer */}
      {notifications.length > 0 && onMarkAllRead && (
        <div className="border-t border-border-default px-4 py-2.5">
          <Button
            variant="tertiary"
            size="sm"
            onClick={onMarkAllRead}
            className="w-full justify-center text-brand-primary"
          >
            Mark all as read
          </Button>
        </div>
      )}
    </GlassSurface>
  )
}
