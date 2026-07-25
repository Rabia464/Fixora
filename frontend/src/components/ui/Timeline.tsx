import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Text } from '@/components/ui/Text'

export type TimelineItemVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand'

export interface TimelineItem {
  id: string
  /** Short action label — e.g. "Status changed to Resolved" */
  action: string
  /** Actor — full_name or email */
  actor?: string
  /** ISO timestamp string */
  timestamp: string
  /** Optional extra detail */
  detail?: ReactNode
  variant?: TimelineItemVariant
}

export interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

const dotColor: Record<TimelineItemVariant, string> = {
  default: 'border-border-default bg-neutral-0',
  brand: 'bg-brand-primary border-brand-primary',
  success: 'bg-success-default border-success-default',
  warning: 'bg-warning-default border-warning-default',
  danger: 'bg-danger-default border-danger-default',
  info: 'bg-info-default border-info-default',
}

/** Timeline — design_system.md §8.17 */
export function Timeline({ items, className }: TimelineProps) {
  if (items.length === 0) return null

  return (
    <ol className={cn('relative flex flex-col', className)} aria-label="Activity timeline">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const variant = item.variant ?? 'default'

        return (
          <li key={item.id} className="relative flex gap-4">
            {/* Vertical track */}
            <div className="relative flex flex-col items-center">
              {/* Dot */}
              <span
                className={cn(
                  'relative z-10 mt-0.5 flex h-3 w-3 shrink-0 rounded-full border-2',
                  dotColor[variant],
                )}
                aria-hidden="true"
              />
              {/* Connecting line */}
              {!isLast && (
                <span
                  className="w-px flex-1 bg-border-default"
                  aria-hidden="true"
                  style={{ marginTop: '2px' }}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn('min-w-0 flex-1 pb-4', isLast && 'pb-0')}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Text variant="body-sm" className="font-medium text-neutral-800">
                  {item.action}
                </Text>
                <span className="text-mono-sm text-neutral-500 whitespace-nowrap tabular-nums">
                  {item.timestamp}
                </span>
              </div>
              {item.actor && (
                <Text variant="body-sm" className="mt-0.5 text-neutral-600">
                  by <span className="font-medium">{item.actor}</span>
                </Text>
              )}
              {item.detail ? (
                <div className="mt-1.5 text-body-sm text-neutral-600">{item.detail}</div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
