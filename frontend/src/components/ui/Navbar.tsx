import { type ReactNode } from 'react'
import { Bell, User } from 'lucide-react'
import { cn } from '@/lib/cn'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'

export interface NavbarProps {
  /** Unread notification count — shown as red badge on bell */
  unreadCount?: number
  /** Called when the bell icon is clicked */
  onNotificationsClick?: () => void
  /** Called when the user avatar is clicked */
  onProfileClick?: () => void
  /** Optional search slot — pass <SearchInput /> or similar */
  searchSlot?: ReactNode
  /** Optional right-side extra actions */
  actions?: ReactNode
  className?: string
}

/** Navbar — design_system.md §8.15 */
export function Navbar({
  unreadCount = 0,
  onNotificationsClick,
  onProfileClick,
  searchSlot,
  actions,
  className,
}: NavbarProps) {
  return (
    <GlassSurface
      elevation="nav"
      as="header"
      className={cn(
        'sticky top-0 z-40 flex h-14 w-full items-center justify-between px-6',
        className,
      )}
    >
      {/* Brand wordmark */}
      <div className="flex shrink-0 items-center gap-2.5">
        {/* Wordmark — Syne bold, brand-primary */}
        <Text
          variant="h3"
          as="span"
          className="font-display tracking-tight text-brand-primary select-none"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Fixora
        </Text>
      </div>

      {/* Center search slot */}
      {searchSlot ? (
        <div className="mx-6 hidden max-w-sm flex-1 sm:block">{searchSlot}</div>
      ) : null}

      {/* Right controls */}
      <div className="flex items-center gap-1">
        {actions}

        {/* Notifications bell */}
        <div className="relative">
          <button
            type="button"
            onClick={onNotificationsClick}
            aria-label={
              unreadCount > 0
                ? `Notifications — ${unreadCount} unread`
                : 'Notifications'
            }
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md text-neutral-600',
              'hover:bg-hover-surface hover:text-neutral-800',
              'focus:outline-none focus:shadow-[var(--color-focus-ring)]',
              'transition-colors duration-[var(--motion-fast)]',
            )}
          >
            <Icon icon={Bell} size="md" />
          </button>
          {unreadCount > 0 ? (
            <Badge
              variant="danger"
              count={unreadCount > 99 ? '99+' : unreadCount}
              className="absolute -top-0.5 -right-0.5 pointer-events-none"
            />
          ) : null}
        </div>

        {/* User avatar */}
        <button
          type="button"
          onClick={onProfileClick}
          aria-label="User profile"
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md text-neutral-600',
            'hover:bg-hover-surface hover:text-neutral-800',
            'focus:outline-none focus:shadow-[var(--color-focus-ring)]',
            'transition-colors duration-[var(--motion-fast)]',
          )}
        >
          <Icon icon={User} size="md" />
        </button>
      </div>
    </GlassSurface>
  )
}
