import {
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md'
  /** Set true for destructive dialogs — Esc will NOT close them */
  critical?: boolean
  children?: ReactNode
  /** Action buttons — align right in footer */
  footer?: ReactNode
  className?: string
}

/** Dialog — design_system.md §8.11 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  size = 'md',
  critical = false,
  children,
  footer,
  className,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const sizeClass = {
    sm: 'max-w-[480px]',
    md: 'max-w-[640px]',
  }

  // Trap focus within the dialog
  const trapFocus = useCallback((e: globalThis.KeyboardEvent) => {
    if (e.key === 'Escape' && !critical) {
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    const panel = panelRef.current
    if (!panel) return
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.closest('[disabled]'))
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus() }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }, [critical, onClose])

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Focus the first focusable element inside the panel
      setTimeout(() => {
        const panel = panelRef.current
        if (!panel) return
        const firstFocusable = panel.querySelector<HTMLElement>(
          'button,input,textarea,select,[tabindex]:not([tabindex="-1"])',
        )
        firstFocusable?.focus()
      }, 10)
      document.addEventListener('keydown', trapFocus)
    } else {
      document.removeEventListener('keydown', trapFocus)
      previousFocusRef.current?.focus()
    }
    return () => document.removeEventListener('keydown', trapFocus)
  }, [open, trapFocus])

  // Scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Scrim */}
      <div
        className="absolute inset-0"
        style={{ background: 'var(--color-bg-overlay)' }}
        aria-hidden="true"
        onClick={critical ? undefined : onClose}
      />

      {/* Panel */}
      <GlassSurface
        ref={panelRef}
        elevation="modal"
        className={cn(
          'relative z-10 w-full rounded-xl p-6',
          'animate-[dialog-in_280ms_cubic-bezier(0.2,0,0,1)_both]',
          sizeClass[size],
          className,
        )}
      >
        {/* Header */}
        {(title || !critical) && (
          <div className="mb-4 flex items-start justify-between gap-4">
            {title ? (
              <Text variant="h3" className="text-neutral-800">
                {title}
              </Text>
            ) : <div />}
            {!critical ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500',
                  'hover:bg-hover-surface hover:text-neutral-800',
                  'focus:outline-none focus:shadow-[var(--color-focus-ring)]',
                  'transition-colors duration-[var(--motion-fast)]',
                )}
              >
                <Icon icon={X} size="sm" />
              </button>
            ) : null}
          </div>
        )}

        {/* Description */}
        {description ? (
          <Text variant="body-md" className="mb-4 text-neutral-600">
            {description}
          </Text>
        ) : null}

        {/* Body */}
        {children ? <div className="text-body-md text-neutral-700">{children}</div> : null}

        {/* Footer */}
        {footer ? (
          <div className="mt-6 flex items-center justify-end gap-3">
            {footer}
          </div>
        ) : null}
      </GlassSurface>

      {/* Keyframe animation injected via global CSS — §6.3 dialog open */}
      <style>{`
        @keyframes dialog-in {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
