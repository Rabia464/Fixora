import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  className?: string
}

/** Pagination — design_system.md §8.13 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const isFirst = page <= 1
  const isLast = page >= totalPages

  const rangeStart = Math.min((page - 1) * pageSize + 1, total)
  const rangeEnd = Math.min(page * pageSize, total)

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3',
        className,
      )}
    >
      {/* Range label */}
      <span className="text-body-sm text-neutral-500 tabular-nums">
        {total === 0
          ? 'No results'
          : `${rangeStart}–${rangeEnd} of ${total}`}
      </span>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="tertiary"
          size="sm"
          disabled={isFirst}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className="h-8 w-8 p-0"
        >
          <Icon icon={ChevronLeft} size="sm" />
        </Button>

        <span className="text-body-sm text-neutral-700 tabular-nums">
          {page} / {totalPages}
        </span>

        <Button
          variant="tertiary"
          size="sm"
          disabled={isLast}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className="h-8 w-8 p-0"
        >
          <Icon icon={ChevronRight} size="sm" />
        </Button>
      </div>
    </div>
  )
}
