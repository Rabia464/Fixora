import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { statusChipTokens, type ComplaintStatus } from '@/lib/tokens'

export interface StatusChipProps {
  status: ComplaintStatus
  label?: string
  icon?: LucideIcon
  className?: string
}

/** Status Chip — design_system.md §8.7 */
export function StatusChip({ status, label, icon, className }: StatusChipProps) {
  const tokens = statusChipTokens[status]
  const displayLabel = label ?? status.replace(/([A-Z])/g, ' $1').trim() // e.g., "UnderReview" -> "Under Review"

  return (
    <span
      style={{
        backgroundColor: tokens.bg,
        color: tokens.fg,
        borderColor: tokens.border,
      }}
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-[6px] border px-[10px] text-caption font-semibold select-none',
        className,
      )}
    >
      {icon ? <Icon icon={icon} size="xs" /> : null}
      <span>{displayLabel}</span>
    </span>
  )
}
