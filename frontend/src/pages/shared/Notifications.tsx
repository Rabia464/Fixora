import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { notificationsApi } from '@/lib/api/notifications'
import { useUiStore } from '@/stores/ui-store'
import type { Notification } from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { Icon } from '@/components/ui/Icon'
import { Pagination } from '@/components/ui/Pagination'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
} from '@/components/ui/Table'
import { cn } from '@/lib/cn'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatTitle(n: Notification): string {
  if (typeof n.payload?.message === 'string') return n.payload.message
  return n.type.replace(/([A-Z])/g, ' $1').trim()
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyNotifications() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
        <Icon icon={Bell} size="lg" />
      </div>
      <div>
        <Text variant="body-md" className="font-semibold text-neutral-700">
          You're all caught up
        </Text>
        <Text variant="body-sm" className="mt-1 text-neutral-500">
          No unread notifications at this time.
        </Text>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/** Role-agnostic notifications page — mounted under each role's layout. */
export function Notifications() {
  const navigate = useNavigate()
  const pushToast = useUiStore((state) => state.pushToast)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markingRead, setMarkingRead] = useState(false)

  // Pagination (client-side — API returns up to 50 at once)
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    let cancelled = false
    try {
      const data = await notificationsApi.list(50)
      if (!cancelled) setNotifications(data)
    } catch (err: unknown) {
      if (!cancelled) {
        const msg = err instanceof Error ? err.message : 'Failed to load notifications.'
        setError(msg)
      }
    } finally {
      if (!cancelled) setLoading(false)
    }
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleMarkAllRead() {
    setMarkingRead(true)
    try {
      await notificationsApi.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      pushToast({ variant: 'success', title: 'All marked as read' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to mark all as read.'
      pushToast({ variant: 'danger', title: 'Error', description: msg })
    } finally {
      setMarkingRead(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  // Paginate
  const total = notifications.length
  const pageStart = (page - 1) * PAGE_SIZE
  const pageSlice = notifications.slice(pageStart, pageStart + PAGE_SIZE)

  return (
    <div className="flex flex-col gap-8">

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Text variant="h1" as="h1" className="text-neutral-900">
            Notifications
          </Text>
          <Text variant="body-md" className="mt-1 text-neutral-500">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'No unread notifications.'}
          </Text>
        </div>
        {unreadCount > 0 && !loading && (
          <Button
            variant="secondary"
            size="md"
            onClick={handleMarkAllRead}
            loading={markingRead}
            className="shrink-0 self-start sm:self-auto"
          >
            <Icon icon={CheckCheck} size="sm" />
            Mark all as read
          </Button>
        )}
      </div>

      {error && (
        <Alert
          variant="danger"
          title="Failed to load"
          description={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* ── Loading Skeleton ── */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyNotifications />
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableTh className="w-4" aria-label="Unread" />
                <TableTh>Message</TableTh>
                <TableTh className="hidden sm:table-cell">Type</TableTh>
                <TableTh className="hidden sm:table-cell">Received</TableTh>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageSlice.map((n) => (
                <TableRow
                  key={n.id}
                  onClick={() => navigate(`../complaints/${n.complaint_id}`, { relative: 'path' })}
                >
                  {/* Unread dot */}
                  <TableTd className="w-4 pr-0">
                    <div className="flex w-4 items-center justify-center">
                      {!n.is_read && (
                        <span
                          className="h-2 w-2 rounded-full bg-brand-primary"
                          aria-label="Unread"
                        />
                      )}
                    </div>
                  </TableTd>

                  <TableTd
                    className={cn(
                      'max-w-[320px] truncate',
                      !n.is_read ? 'font-medium text-neutral-900' : 'text-neutral-700',
                    )}
                  >
                    {formatTitle(n)}
                  </TableTd>

                  <TableTd className="hidden whitespace-nowrap text-neutral-500 sm:table-cell">
                    {n.type.replace(/([A-Z])/g, ' $1').trim()}
                  </TableTd>

                  <TableTd className="hidden whitespace-nowrap text-mono-sm text-neutral-500 sm:table-cell">
                    {formatRelative(n.created_at)}
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
                onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
