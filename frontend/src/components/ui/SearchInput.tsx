import { forwardRef, type InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
}

/** Search Bar — design_system.md §8.5 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, className, disabled, placeholder = 'Search...', ...props }, ref) => {
    const handleClear = () => {
      onChange('')
      if (onClear) {
        onClear()
      }
    }

    return (
      <div className="relative flex w-full items-center">
        <div className="pointer-events-none absolute left-3 flex items-center text-neutral-500">
          <Icon icon={Search} size="sm" />
        </div>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'h-10 w-full rounded-md border border-border-default bg-bg-input pl-10 pr-9 text-body-md text-neutral-800',
            'placeholder:text-neutral-400',
            'transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)]',
            'focus:border-border-focus focus:outline-none focus:shadow-[var(--color-focus-ring)]',
            'disabled:cursor-not-allowed disabled:bg-bg-input-disabled disabled:text-disabled-fg',
            className,
          )}
          {...props}
        />
        {value && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 hover:bg-hover-surface hover:text-neutral-800 focus-visible:shadow-[var(--color-focus-ring)] focus-visible:outline-none transition-colors"
            aria-label="Clear search"
          >
            <Icon icon={X} size="sm" />
          </button>
        ) : null}
      </div>
    )
  },
)

SearchInput.displayName = 'SearchInput'
