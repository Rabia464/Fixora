import type { LucideIcon } from 'lucide-react'
import { iconSize, iconStroke, type IconSize } from '@/lib/tokens'
import { cn } from '@/lib/cn'

interface IconProps {
  icon: LucideIcon
  size?: IconSize
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
  'aria-label'?: string
}

/** Lucide wrapper locked to design_system.md §7 stroke + size tokens. */
export function Icon({
  icon: Glyph,
  size = 'md',
  className,
  'aria-hidden': ariaHidden = true,
  'aria-label': ariaLabel,
}: IconProps) {
  const px = iconSize[size]
  const stroke = size === 'xl' ? iconStroke.xl : iconStroke.default

  return (
    <Glyph
      size={px}
      strokeWidth={stroke}
      className={cn('shrink-0', className)}
      aria-hidden={ariaLabel ? undefined : ariaHidden}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    />
  )
}
