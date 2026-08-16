import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Text } from '@/components/ui/Text'

/**
 * PublicNavbar — displayed on public routes (/about, /login).
 * Reuses GlassSurface + design tokens. Does NOT include auth controls.
 */
export function PublicNavbar() {
  return (
    <GlassSurface
      elevation="nav"
      as="header"
      className="sticky top-0 z-40 flex h-14 w-full items-center justify-between px-6"
    >
      {/* Brand wordmark */}
      <NavLink
        to="/about"
        className="flex shrink-0 items-center gap-2.5 no-underline"
        aria-label="Fixora home"
      >
        <Text
          variant="h3"
          as="span"
          className="font-display tracking-tight text-brand-primary select-none"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Fixora
        </Text>
      </NavLink>

      {/* Nav links */}
      <nav aria-label="Public navigation" className="flex items-center gap-1">
        <NavLink
          to="/about"
          className={({ isActive }: { isActive: boolean }) =>
            cn(
              'inline-flex h-9 items-center rounded-md px-3 text-body-sm font-medium no-underline transition-colors duration-[var(--motion-fast)]',
              isActive
                ? 'bg-brand-primary-subtle text-brand-primary'
                : 'text-neutral-600 hover:bg-hover-surface hover:text-neutral-800',
            )
          }
        >
          About
        </NavLink>
        <NavLink
          to="/login"
          className={({ isActive }: { isActive: boolean }) =>
            cn(
              'inline-flex h-9 items-center rounded-md px-3 text-body-sm font-medium no-underline transition-colors duration-[var(--motion-fast)]',
              isActive
                ? 'bg-brand-primary text-neutral-0'
                : 'bg-brand-primary text-neutral-0 hover:bg-brand-primary-hover',
            )
          }
        >
          Login
        </NavLink>
      </nav>
    </GlassSurface>
  )
}
