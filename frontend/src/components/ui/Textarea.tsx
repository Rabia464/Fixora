import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Text } from '@/components/ui/Text'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  error?: string
}

/** Text Area — design_system.md §8.3 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, id, className, disabled, ...props }, ref) => {
    const textareaId = id ?? props.name
    const describedBy = error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined

    return (
      <div className="flex w-full flex-col gap-2">
        {label ? (
          <label htmlFor={textareaId} className="text-caption font-semibold text-neutral-700">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            'min-h-[96px] w-full rounded-md border bg-bg-input px-3 py-[10px] text-body-md text-neutral-800',
            'placeholder:text-neutral-400 resize-y',
            'transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)]',
            'disabled:cursor-not-allowed disabled:bg-bg-input-disabled disabled:text-disabled-fg',
            'focus:outline-none focus:shadow-[var(--color-focus-ring)]',
            error ? 'border-border-danger focus:border-border-danger' : 'border-border-default focus:border-border-focus',
            className,
          )}
          {...props}
        />
        {error ? (
          <Text id={`${textareaId}-error`} variant="body-sm" className="text-danger-default">
            {error}
          </Text>
        ) : helperText ? (
          <Text id={`${textareaId}-helper`} variant="body-sm" className="text-neutral-600">
            {helperText}
          </Text>
        ) : null}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
