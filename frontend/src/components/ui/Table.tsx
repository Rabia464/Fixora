import { type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

// ─── Root Table ──────────────────────────────────────────────────────────────

interface TableProps {
  children: ReactNode
  className?: string
  /** Wraps table in a horizontal-scroll container */
  scrollable?: boolean
}

/** Table root — design_system.md §8.12 */
export function Table({ children, className, scrollable = true }: TableProps) {
  const inner = (
    <table
      className={cn('w-full border-collapse text-body-md text-neutral-800', className)}
    >
      {children}
    </table>
  )
  if (scrollable) {
    return (
      <div className="w-full overflow-x-auto rounded-md border border-border-default bg-bg-surface">
        {inner}
      </div>
    )
  }
  return inner
}

// ─── Head ────────────────────────────────────────────────────────────────────

interface TableHeadProps { children: ReactNode; className?: string }

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <thead className={cn('bg-neutral-50', className)}>
      {children}
    </thead>
  )
}

// ─── Body ────────────────────────────────────────────────────────────────────

interface TableBodyProps { children: ReactNode; className?: string }

export function TableBody({ children, className }: TableBodyProps) {
  return <tbody className={cn('divide-y divide-border-default', className)}>{children}</tbody>
}

// ─── Row ─────────────────────────────────────────────────────────────────────

interface TableRowProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  /** When true, row shows hover background */
  hoverable?: boolean
}

export function TableRow({ children, className, onClick, hoverable = true }: TableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)]',
        hoverable && 'hover:bg-hover-surface',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </tr>
  )
}

// ─── Header Cell ─────────────────────────────────────────────────────────────

interface TableThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode
  className?: string
}

export function TableTh({ children, className, ...props }: TableThProps) {
  return (
    <th
      className={cn(
        'h-10 px-4 text-left text-caption font-semibold text-neutral-600 whitespace-nowrap',
        'border-b border-border-default',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  )
}

// ─── Data Cell ───────────────────────────────────────────────────────────────

interface TableTdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode
  className?: string
  /** Renders content in monospace — for ticket IDs, timestamps */
  mono?: boolean
}

export function TableTd({ children, className, mono, ...props }: TableTdProps) {
  return (
    <td
      className={cn(
        'h-12 px-4 py-3 text-neutral-800 align-middle',
        mono && 'text-mono-md font-medium text-brand-primary',
        className,
      )}
      {...props}
    >
      {children}
    </td>
  )
}
