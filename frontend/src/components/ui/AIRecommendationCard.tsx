import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'

export interface AIField {
  label: string
  value: ReactNode
}

export interface AIRecommendationCardProps {
  fields: AIField[]
  helperText?: string
  /** Optional slot for edit controls beside each field */
  editable?: boolean
  className?: string
}

/** AI Recommendation Card — design_system.md §8.21 */
export function AIRecommendationCard({
  fields,
  helperText = 'You can override these before forwarding.',
  className,
}: AIRecommendationCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--color-info-default)]/30 bg-info-subtle p-4',
        className,
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <Icon icon={Sparkles} size="sm" className="text-info-default" />
        <Text variant="caption" className="font-semibold uppercase tracking-widest text-info-default">
          AI suggestion
        </Text>
      </div>

      {/* Fields */}
      <dl className="flex flex-col gap-2">
        {fields.map((field) => (
          <div key={field.label} className="flex flex-wrap items-baseline gap-2">
            <dt className="text-caption font-semibold text-neutral-600 w-[120px] shrink-0">
              {field.label}
            </dt>
            <dd className="text-body-sm text-neutral-800">{field.value}</dd>
          </div>
        ))}
      </dl>

      {/* Helper */}
      {helperText && (
        <Text variant="body-sm" className="mt-3 text-neutral-500">
          {helperText}
        </Text>
      )}
    </div>
  )
}
