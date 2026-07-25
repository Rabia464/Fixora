import type { ElementType, HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const variantClass = {
  'display-lg': 'text-display-lg',
  'display-md': 'text-display-md',
  h1: 'text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
  h4: 'text-h4',
  'body-lg': 'text-body-lg',
  'body-md': 'text-body-md',
  'body-sm': 'text-body-sm',
  caption: 'text-caption',
  'mono-md': 'text-mono-md',
  'mono-sm': 'text-mono-sm',
} as const

export type TextVariant = keyof typeof variantClass

const defaultElement: Record<TextVariant, ElementType> = {
  'display-lg': 'h1',
  'display-md': 'h2',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  'body-lg': 'p',
  'body-md': 'p',
  'body-sm': 'p',
  caption: 'span',
  'mono-md': 'span',
  'mono-sm': 'span',
}

interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant
  as?: ElementType
}

/** Typography primitive — only design_system.md type tokens. */
export function Text({
  variant = 'body-md',
  as,
  className,
  children,
  ...props
}: TextProps) {
  const Component = as ?? defaultElement[variant]
  return (
    <Component className={cn(variantClass[variant], className)} {...props}>
      {children}
    </Component>
  )
}
