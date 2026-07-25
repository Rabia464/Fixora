import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Text } from '@/components/ui/Text'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
}

/** Input — design_system.md §8.2 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, id, className, disabled, ...props }, ref) => {
    const inputId = id ?? props.name
    const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-caption font-semibold text-neutral-800">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            'h-10 w-full rounded-md border bg-bg-input px-3 py-[10px] text-body-md text-neutral-800',
            'placeholder:text-neutral-400',
            'transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)]',
            'disabled:cursor-not-allowed disabled:bg-bg-input-disabled disabled:text-disabled-fg',
            'focus:outline-none focus:shadow-[var(--color-focus-ring)]',
            error ? 'border-border-danger focus:border-border-danger' : 'border-border-default focus:border-border-focus',
            className,
          )}
          {...props}
        />
        {error ? (
          <Text id={describedBy} variant="body-sm" className="text-danger-default">
            {error}
          </Text>
        ) : helperText ? (
          <Text id={describedBy} variant="body-sm" className="text-neutral-600">
            {helperText}
          </Text>
        ) : null}
      </div>
    )
  },
)

Input.displayName = 'Input'
