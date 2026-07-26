import {
  useState,
  useRef,
  useEffect,
  useId,
  type KeyboardEvent,
} from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Icon } from '@/components/ui/Icon'

export interface DropdownOption<T extends string = string> {
  value: T
  label: string
  disabled?: boolean
}

export interface DropdownProps<T extends string = string> {
  options: DropdownOption<T>[]
  value?: T | null
  onChange: (value: T) => void
  placeholder?: string
  label?: string
  helperText?: string
  error?: string
  disabled?: boolean
  className?: string
  /** Width of the trigger button */
  triggerClassName?: string
}

/** Dropdown / Select — design_system.md §8.4 */
export function Dropdown<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  label,
  helperText,
  error,
  disabled = false,
  className,
  triggerClassName,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const triggerId = useId()
  const listId = useId()

  const selectedOption = options.find((o) => o.value === value) ?? null

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  // Reset focus index on open
  useEffect(() => {
    if (open) {
      const idx = selectedOption ? options.findIndex((o) => o.value === selectedOption.value) : -1
      setFocusedIndex(idx)
    }
  }, [open, options, selectedOption])

  // Scroll focused item into view
  useEffect(() => {
    if (!open || focusedIndex < 0) return
    const item = listRef.current?.children[focusedIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [focusedIndex, open])

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return
    const enabledIndexes = options.reduce<number[]>((acc, o, i) => {
      if (!o.disabled) acc.push(i)
      return acc
    }, [])

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!open) {
          setOpen(true)
        } else if (focusedIndex >= 0 && !options[focusedIndex]?.disabled) {
          onChange(options[focusedIndex].value)
          setOpen(false)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!open) { setOpen(true); break }
        {
          const nextIdx = enabledIndexes.find((i) => i > focusedIndex) ?? enabledIndexes[0]
          if (nextIdx !== undefined) setFocusedIndex(nextIdx)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        {
          const prevIdx = [...enabledIndexes].reverse().find((i) => i < focusedIndex) ?? enabledIndexes[enabledIndexes.length - 1]
          if (prevIdx !== undefined) setFocusedIndex(prevIdx)
        }
        break
      case 'Escape':
        setOpen(false)
        break
    }
  }

  function handleSelect(option: DropdownOption<T>) {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative flex w-full flex-col gap-2', className)}>
      {label ? (
        <label htmlFor={triggerId} className="text-caption font-semibold text-neutral-700">
          {label}
        </label>
      ) : null}

      <button
        id={triggerId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={label ?? placeholder}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onClick={() => !disabled && setOpen((p) => !p)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border bg-bg-input px-3 text-body-md',
          'transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)]',
          'focus:outline-none focus:shadow-[var(--color-focus-ring)]',
          'disabled:cursor-not-allowed disabled:bg-bg-input-disabled disabled:text-disabled-fg',
          error
            ? 'border-border-danger'
            : open
              ? 'border-border-focus'
              : 'border-border-default',
          selectedOption ? 'text-neutral-800' : 'text-neutral-400',
          triggerClassName,
        )}
      >
        <span className="truncate">{selectedOption?.label ?? placeholder}</span>
        <Icon
          icon={ChevronDown}
          size="sm"
          className={cn(
            'ml-2 shrink-0 text-neutral-500 transition-transform duration-[var(--motion-fast)]',
            open && 'rotate-180',
          )}
        />
      </button>

      {open ? (
        <GlassSurface
          elevation="dropdown"
          className={cn(
            'absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-lg',
            'max-h-[280px] overflow-y-auto',
          )}
          style={{ animationDuration: 'var(--motion-normal)' }}
        >
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label ?? placeholder}
            className="p-1"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value
              const isFocused = index === focusedIndex
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                  onMouseEnter={() => !option.disabled && setFocusedIndex(index)}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'flex h-9 cursor-pointer items-center justify-between rounded-md px-3 text-body-md',
                    'transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)]',
                    'select-none',
                    option.disabled
                      ? 'cursor-not-allowed text-disabled-fg'
                      : isSelected
                        ? 'bg-brand-primary-subtle text-brand-primary font-medium'
                        : isFocused
                          ? 'bg-hover-surface text-neutral-800'
                          : 'text-neutral-800',
                  )}
                >
                  <span>{option.label}</span>
                  {isSelected ? <Icon icon={Check} size="sm" className="text-brand-primary" /> : null}
                </li>
              )
            })}
          </ul>
        </GlassSurface>
      ) : null}

      {error ? (
        <p className="text-body-sm text-danger-default">{error}</p>
      ) : helperText ? (
        <p className="text-body-sm text-neutral-600">{helperText}</p>
      ) : null}
    </div>
  )
}
