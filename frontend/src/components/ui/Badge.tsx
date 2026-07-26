import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'danger' | 'brand'
  count?: number | string
}

/** Badge — design_system.md §8.8 */
export function Badge({ variant = 'brand', count, className, children, ...props }: BadgeProps) {
  const variantClass = {
    brand: 'bg-brand-primary text-neutral-0',
    danger: 'bg-danger-default text-neutral-0',
  }

  const content = count !== undefined ? count : children

  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-2',
        'text-[10px] font-semibold leading-none tabular-nums',
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {content}
    </span>
  )
}
