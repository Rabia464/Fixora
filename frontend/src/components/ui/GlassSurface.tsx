import { forwardRef, type ElementType, type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type GlassElevation = 'dropdown' | 'nav' | 'modal'

const elevationClass: Record<GlassElevation, string> = {
  dropdown: 'elevation-dropdown',
  nav: 'elevation-nav',
  modal: 'elevation-modal',
}

export interface GlassSurfaceProps extends HTMLAttributes<HTMLElement> {
  elevation?: GlassElevation
  /** Render as a different HTML element — default div */
  as?: ElementType
}

/**
 * Liquid Glass surface — design_system.md glass recipe.
 * Use ONLY for nav, sidebar shell, menus, dialogs, dropdowns, toasts.
 * Never apply to content cards, tables, forms, or page backgrounds.
 */
export const GlassSurface = forwardRef<HTMLElement, GlassSurfaceProps>(
  ({ elevation = 'dropdown', as: Component = 'div', className, children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn('surface-glass', elevationClass[elevation], className)}
        {...props}
      >
        {children}
      </Component>
    )
  },
)

GlassSurface.displayName = 'GlassSurface'
