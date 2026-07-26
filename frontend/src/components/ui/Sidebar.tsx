import { useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'

// ─── Nav Item ────────────────────────────────────────────────────────────────

export interface SidebarNavItem {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  active?: boolean
  onClick?: () => void
}

interface NavItemProps {
  item: SidebarNavItem
  collapsed: boolean
}

function NavItem({ item, collapsed }: NavItemProps) {
  const { label, icon: Glyph, active, onClick } = item
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex w-full items-center gap-3 rounded-md px-3 py-2.5',
        'transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)]',
        'focus:outline-none focus:shadow-[var(--color-focus-ring)]',
        active
          ? 'bg-brand-primary-subtle text-brand-primary font-medium'
          : 'text-neutral-700 hover:bg-hover-surface hover:text-neutral-800',
        collapsed && 'justify-center px-0',
      )}
    >
      <Glyph
        size={20}
        strokeWidth={1.75}
        className={cn(
          'shrink-0 transition-colors duration-[var(--motion-fast)]',
          active ? 'text-brand-primary' : 'text-neutral-500 group-hover:text-neutral-800',
        )}
      />
      {!collapsed && (
        <span className="truncate text-body-md">{label}</span>
      )}
    </button>
  )
}

// ─── Nav Section ─────────────────────────────────────────────────────────────

interface NavSectionProps {
  title: string
  items: SidebarNavItem[]
  collapsed: boolean
}

function NavSection({ title, items, collapsed }: NavSectionProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {!collapsed && (
        <Text
          variant="caption"
          className="mb-1 px-3 font-semibold uppercase tracking-widest text-neutral-400"
        >
          {title}
        </Text>
      )}
      {items.map((item) => (
        <NavItem key={item.id} item={item} collapsed={collapsed} />
      ))}
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export interface SidebarSection {
  title: string
  items: SidebarNavItem[]
}

export interface SidebarProps {
  sections: SidebarSection[]
  userEmail?: string
  userRole?: string
  /** Control collapse externally — or leave unset for internal state */
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  className?: string
  /** Bottom extra slot — e.g. settings link */
  footer?: ReactNode
}

/** Sidebar — design_system.md §8.14 */
export function Sidebar({
  sections,
  userEmail,
  userRole,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  className,
  footer,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const collapsed = controlledCollapsed ?? internalCollapsed
  const setCollapsed = (val: boolean) => {
    setInternalCollapsed(val)
    onCollapsedChange?.(val)
  }

  return (
    <GlassSurface
      elevation="nav"
      as="aside"
      className={cn(
        'flex h-full flex-col justify-between overflow-x-hidden',
        'transition-[width] duration-[var(--motion-normal)] ease-[var(--ease-standard)]',
        collapsed ? 'w-[72px]' : 'w-[240px]',
        className,
      )}
    >
      {/* Top — nav sections */}
      <nav className="flex flex-col gap-6 overflow-y-auto p-3" aria-label="Sidebar navigation">
        {sections.map((section) => (
          <NavSection
            key={section.title}
            title={section.title}
            items={section.items}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Bottom — user profile + collapse toggle */}
      <div className="flex flex-col gap-1 border-t border-border-default p-3">
        {/* User profile lockup */}
        {userEmail && (
          <div
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2',
              collapsed && 'justify-center px-0',
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary-subtle text-brand-primary text-caption font-semibold select-none">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-caption font-semibold text-neutral-800">{userEmail}</p>
                {userRole && (
                  <p className="truncate text-caption text-neutral-500">{userRole}</p>
                )}
              </div>
            )}
          </div>
        )}

        {footer}

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex h-8 w-full items-center rounded-md px-3 text-neutral-500',
            'hover:bg-hover-surface hover:text-neutral-800',
            'focus:outline-none focus:shadow-[var(--color-focus-ring)]',
            'transition-colors duration-[var(--motion-fast)]',
            collapsed ? 'justify-center px-0' : 'gap-2',
          )}
        >
          <Icon
            icon={collapsed ? ChevronRight : ChevronLeft}
            size="sm"
          />
          {!collapsed && (
            <span className="text-body-sm">Collapse</span>
          )}
        </button>
      </div>
    </GlassSurface>
  )
}
