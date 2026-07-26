import { useEffect, useState, useCallback, useDeferredValue } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, CheckCircle } from 'lucide-react'
import { complaintsApi } from '@/lib/api/complaints'
import type { Complaint, ComplaintStatus } from '@/types/api'
import { Text } from '@/components/ui/Text'
import { StatusChip } from '@/components/ui/StatusChip'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { Icon } from '@/components/ui/Icon'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
} from '@/components/ui/Table'
import type { ComplaintStatus as TokenStatus } from '@/lib/tokens'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

/** Active statuses shown in the Assigned view */
const ACTIVE_STATUSES: ComplaintStatus[] = ['Forwarded', 'InProgress']
/** Completed statuses shown in the Resolved view */
const RESOLVED_STATUSES: ComplaintStatus[] = ['Resolved', 'Closed']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Shared Queue Component ───────────────────────────────────────────────────

interface MaintenanceQueueProps {
  /** 'assigned' shows active tasks; 'resolved' shows completed */
  mode: 'assigned' | 'resolved'
}

export function MaintenanceQueue({ mode }: MaintenanceQueueProps) {
  const navigate = useNavigate()

  const isAssigned = mode === 'assigned'
  const activeStatuses = isAssigned ? ACTIVE_STATUSES : RESOLVED_STATUSES

  const [all, setAll] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    let cancelled = false
    setLoading(true)
    setError(null)
    try {
      const data = await complaintsApi.maintenanceList({ limit: 100 })
      if (!cancelled) {
        setAll(data)
        setPage(1)
      }
    } catch (err: unknown) {
      if (!cancelled) {
        const msg = err instanceof Error ? err.message : 'Failed to load complaints.'
        setError(msg)
      }
    } finally {
      if (!cancelled) setLoading(false)
    }
    return () => { cancelled = true }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [deferredSearch])

  // Client-side status filter + search
  const filtered = all
    .filter((c) => activeStatuses.includes(c.status))
    .filter((c) => {
      if (!deferredSearch) return true
      const q = deferredSearch.toLowerCase()
      return (
        c.title.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.hostel.toLowerCase().includes(q)
      )
    })

  const total = filtered.length
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const EmptyIcon = isAssigned ? Wrench : CheckCircle
  const emptyMessage = isAssigned
    ? 'No active tasks assigned to you.'
    : 'No resolved tasks yet.'
  const emptyHint = isAssigned
    ? 'Complaints forwarded by supervisors will appear here.'
    : 'Resolved and closed complaints will appear here.'

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page Header ── */}
      <div>
        <Text variant="h1" as="h1" className="text-neutral-900">
          {isAssigned ? 'Assigned Tasks' : 'Resolved Tasks'}
        </Text>
        <Text variant="body-md" className="mt-1 text-neutral-500">
          {isAssigned
            ? 'Complaints forwarded to your team for action.'
            : 'Completed and closed complaints.'}
        </Text>
      </div>

      {error && (
        <Alert
          variant="danger"
          title="Failed to load"
          description={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* ── Search ── */}
      <div className="max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by title, location, or hostel…"
          disabled={loading}
          aria-label="Search tasks"
        />
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isAssigned ? 'bg-neutral-100 text-neutral-400' : 'bg-success-subtle text-success-default'}`}>
            <Icon icon={EmptyIcon} size="lg" />
          </div>
          <div>
            <Text variant="body-md" className="font-semibold text-neutral-700">
              {search ? 'No results for your search.' : emptyMessage}
            </Text>
            <Text variant="body-sm" className="mt-1 text-neutral-500">
              {search ? 'Try a different keyword.' : emptyHint}
            </Text>
          </div>
        </div>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>Title</TableTh>
                <TableTh className="hidden sm:table-cell">Hostel</TableTh>
                <TableTh className="hidden sm:table-cell">Location</TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="hidden md:table-cell">Filed</TableTh>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageSlice.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => navigate(`/maintenance/complaints/${c.id}`)}
                >
                  <TableTd className="max-w-[200px] truncate font-medium text-neutral-800">
                    {c.title}
                  </TableTd>
                  <TableTd className="hidden text-neutral-600 sm:table-cell">
                    {c.hostel}
                  </TableTd>
                  <TableTd className="hidden text-neutral-600 sm:table-cell">
                    {c.location}
                  </TableTd>
                  <TableTd>
                    <StatusChip status={c.status as TokenStatus} />
                  </TableTd>
                  <TableTd className="hidden whitespace-nowrap text-neutral-500 md:table-cell">
                    {formatDate(c.created_at)}
                  </TableTd>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {total > PAGE_SIZE && (
            <div className="border-t border-border-default">
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={(p) => {
                  setPage(p)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
