import type { ReactNode } from 'react'
import { Info, CheckCircle, AlertTriangle, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

export interface AlertProps {
  variant?: AlertVariant
  title?: string
  description?: string
  onDismiss?: () => void
  className?: string
  children?: ReactNode
}

const variantConfig = {
  info: {
    bgClass: 'bg-info-subtle text-neutral-800',
    borderClass: 'border-l-info-default',
    iconColorClass: 'text-info-default',
    icon: Info,
  },
  success: {
    bgClass: 'bg-success-subtle text-neutral-800',
    borderClass: 'border-l-success-default',
    iconColorClass: 'text-success-default',
    icon: CheckCircle,
  },
  warning: {
    bgClass: 'bg-warning-subtle text-neutral-800',
    borderClass: 'border-l-warning-default',
    iconColorClass: 'text-warning-default',
    icon: AlertTriangle,
  },
  danger: {
    bgClass: 'bg-danger-subtle text-neutral-800',
    borderClass: 'border-l-danger-default',
    iconColorClass: 'text-danger-default',
    icon: AlertCircle,
  },
} as const

/** Alert — design_system.md §8.9 */
export function Alert({
  variant = 'info',
  title,
  description,
  onDismiss,
  className,
  children,
}: AlertProps) {
  const config = variantConfig[variant]
  const DisplayIcon = config.icon

  return (
    <div
      role="alert"
      className={cn(
        'relative flex w-full gap-3 rounded-md border-l-[3px] bg-neutral-0 p-4',
        config.bgClass,
        config.borderClass,
        className,
      )}
    >
      <div className={cn('flex shrink-0 items-start', config.iconColorClass)}>
        <Icon icon={DisplayIcon} size="md" />
      </div>

      <div className="flex-1">
        {title ? (
          <h5 className="font-semibold text-neutral-800 text-body-md leading-normal">{title}</h5>
        ) : null}
        {description ? (
          <p className="mt-1 text-neutral-600 text-body-sm leading-relaxed">{description}</p>
        ) : null}
        {children ? <div className="mt-2 text-neutral-700">{children}</div> : null}
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 hover:bg-hover-surface hover:text-neutral-800 focus-visible:shadow-[var(--color-focus-ring)] focus-visible:outline-none transition-colors"
          aria-label="Dismiss alert"
        >
          <Icon icon={X} size="sm" />
        </button>
      ) : null}
    </div>
  )
}
