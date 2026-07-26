import { useEffect, useState, useCallback, useDeferredValue } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { complaintsApi } from '@/lib/api/complaints'
import type { Complaint, ComplaintStatus } from '@/types/api'
import { Text } from '@/components/ui/Text'
import { StatusChip } from '@/components/ui/StatusChip'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { Icon } from '@/components/ui/Icon'
import { SearchInput } from '@/components/ui/SearchInput'
import { Dropdown } from '@/components/ui/Dropdown'
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

const STATUS_OPTIONS: { value: ComplaintStatus | 'All'; label: string }[] = [
  { value: 'All', label: 'All Statuses' },
  { value: 'Open', label: 'Open' },
  { value: 'UnderReview', label: 'Under Review' },
  { value: 'Forwarded', label: 'Forwarded' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Reopened', label: 'Reopened' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Complaints List ──────────────────────────────────────────────────────────

export function SupervisorComplaintsList() {
  const navigate = useNavigate()

  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'All'>('Open')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    let cancelled = false
    setLoading(true)
    setError(null)
    try {
      const params = statusFilter !== 'All' ? { status: statusFilter } : {}
      const data = await complaintsApi.list(params)
      if (!cancelled) {
        setComplaints(data)
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
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  // Client-side search filter
  const filtered = complaints.filter((c) => {
    if (!deferredSearch) return true
    const q = deferredSearch.toLowerCase()
    return (
      c.title.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.hostel.toLowerCase().includes(q)
    )
  })

  // Reset page when search changes
  useEffect(() => { setPage(1) }, [deferredSearch])

  const total = filtered.length
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page Header ── */}
      <div>
        <Text variant="h1" as="h1" className="text-neutral-900">
          Complaints
        </Text>
        <Text variant="body-md" className="mt-1 text-neutral-500">
          Review and manage all hostel complaints.
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

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by title, location, or hostel…"
            disabled={loading}
            aria-label="Search complaints"
          />
        </div>
        <div className="w-full sm:w-48">
          <Dropdown<ComplaintStatus | 'All'>
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setSearch('') }}
            label=""
            placeholder="Filter by status"
            disabled={loading}
          />
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
            <Icon icon={FileText} size="lg" />
          </div>
          <Text variant="body-md" className="font-semibold text-neutral-700">
            {search ? 'No results for your search.' : 'No complaints match this filter.'}
          </Text>
          <Text variant="body-sm" className="text-neutral-500">
            {search ? 'Try a different keyword.' : 'Try selecting a different status.'}
          </Text>
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
                  onClick={() => navigate(`/supervisor/complaints/${c.id}`)}
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
