import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'brand'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-action-default text-action-foreground hover:bg-action-hover active:bg-action-pressed',
  secondary:
    'bg-transparent text-brand-primary border border-brand-primary hover:bg-brand-primary-subtle',
  tertiary: 'bg-transparent text-neutral-800 hover:bg-hover-surface',
  danger: 'bg-danger-default text-neutral-0 hover:opacity-90',
  brand: 'bg-brand-primary text-neutral-0 hover:bg-brand-primary-hover',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-body-sm font-medium',
  md: 'h-10 px-4 text-body-md font-medium',
  lg: 'h-12 px-5 text-body-lg font-semibold',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

/** Button — design_system.md §8.1 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-md transition-colors',
          'duration-[var(--motion-fast)] ease-[var(--ease-standard)]',
          'disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-disabled-fg disabled:border-disabled-border',
          variantClass[variant],
          sizeClass[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon icon={LoaderCircle} size="sm" className="animate-spin" />
          </div>
        ) : null}
        <span className={cn('inline-flex items-center gap-2', loading && 'opacity-0')}>
          {children}
        </span>
      </button>
    )
  },
)

Button.displayName = 'Button'
