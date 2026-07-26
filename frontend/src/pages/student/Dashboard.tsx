import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, CheckCircle, Clock, Bell } from 'lucide-react'
import { complaintsApi } from '@/lib/api/complaints'
import { notificationsApi } from '@/lib/api/notifications'
import { useAuthStore } from '@/stores/auth-store'
import type { Complaint, Notification } from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { StatusChip } from '@/components/ui/StatusChip'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { Icon } from '@/components/ui/Icon'
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  iconClass: string
  bgClass: string
}

function StatCard({ label, value, icon: Glyph, iconClass, bgClass }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border-default bg-bg-card p-4">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', bgClass)}>
        <Glyph size={18} strokeWidth={1.75} className={iconClass} />
      </div>
      <div className="min-w-0">
        <p className="text-display-sm font-bold tabular-nums text-neutral-900">{value}</p>
        <p className="text-caption text-neutral-500">{label}</p>
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyComplaints({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
        <Icon icon={FileText} size="lg" />
      </div>
      <div>
        <Text variant="body-md" className="font-semibold text-neutral-700">
          No complaints yet
        </Text>
        <Text variant="body-sm" className="mt-1 text-neutral-500">
          Submit your first complaint and we'll track it for you.
        </Text>
      </div>
      <Button variant="brand" size="sm" onClick={onNew}>
        <Icon icon={Plus} size="sm" />
        New Complaint
      </Button>
    </div>
  )
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [c, n] = await Promise.all([
          complaintsApi.list({ limit: 5 }),
          notificationsApi.list(3),
        ])
        if (!cancelled) {
          setComplaints(c)
          setNotifications(n)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load dashboard.'
          setError(msg)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const firstName = user?.full_name?.split(' ')[0] ?? 'there'
  const total = complaints.length
  const open = complaints.filter((c) => c.status === 'Open' || c.status === 'Reopened').length
  const resolved = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="flex flex-col gap-8">

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Text variant="h1" as="h1" className="text-neutral-900">
            Good to see you, {firstName}
          </Text>
          <Text variant="body-md" className="mt-1 text-neutral-500">
            Here's a summary of your complaints.
          </Text>
        </div>
        <Button
          variant="brand"
          size="md"
          onClick={() => navigate('/student/complaints/new')}
          className="shrink-0 self-start sm:self-auto"
        >
          <Icon icon={Plus} size="sm" />
          New Complaint
        </Button>
      </div>

      {error && (
        <Alert
          variant="danger"
          title="Failed to load"
          description={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* ── Stat Cards ── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Submitted"
            value={total}
            icon={FileText}
            bgClass="bg-brand-primary-subtle"
            iconClass="text-brand-primary"
          />
          <StatCard
            label="Open"
            value={open}
            icon={Clock}
            bgClass="bg-warning-subtle"
            iconClass="text-warning-default"
          />
          <StatCard
            label="Resolved"
            value={resolved}
            icon={CheckCircle}
            bgClass="bg-success-subtle"
            iconClass="text-success-default"
          />
        </div>
      )}

      {/* ── Recent Complaints ── */}
      <section aria-labelledby="recent-heading">
        <div className="mb-4 flex items-center justify-between">
          <Text variant="h3" as="h2" id="recent-heading" className="text-neutral-800">
            Recent Complaints
          </Text>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <EmptyComplaints onNew={() => navigate('/student/complaints/new')} />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>Title</TableTh>
                <TableTh>Location</TableTh>
                <TableTh>Status</TableTh>
                <TableTh>Filed</TableTh>
              </TableRow>
            </TableHead>
            <TableBody>
              {complaints.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => navigate(`/student/complaints/${c.id}`)}
                >
                  <TableTd className="font-medium text-neutral-800 max-w-[240px] truncate">
                    {c.title}
                  </TableTd>
                  <TableTd className="text-neutral-600">{c.location}</TableTd>
                  <TableTd>
                    <StatusChip status={c.status} />
                  </TableTd>
                  <TableTd className="whitespace-nowrap text-neutral-500">
                    {formatDate(c.created_at)}
                  </TableTd>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {/* ── Notification Summary ── */}
      {!loading && notifications.length > 0 && (
        <section aria-labelledby="notif-heading">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Text variant="h3" as="h2" id="notif-heading" className="text-neutral-800">
                Notifications
              </Text>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger-default px-1.5 text-[10px] font-semibold tabular-nums text-neutral-0">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate('/student/notifications')}
              className="text-body-sm font-medium text-brand-primary hover:underline focus:outline-none focus-visible:shadow-[var(--color-focus-ring)] rounded px-1"
            >
              View all
            </button>
          </div>

          <div className="flex flex-col divide-y divide-border-default rounded-lg border border-border-default overflow-hidden">
            {notifications.map((n) => {
              const title = typeof n.payload?.message === 'string'
                ? n.payload.message
                : n.type.replace(/([A-Z])/g, ' $1').trim()
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => navigate(`/student/complaints/${n.complaint_id}`)}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left',
                    'hover:bg-hover-surface transition-colors duration-[var(--motion-fast)]',
                    'focus:outline-none focus:bg-hover-surface',
                  )}
                >
                  <div className="mt-2 flex w-2 shrink-0 justify-center">
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-brand-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-body-sm text-neutral-800', !n.is_read && 'font-medium')}>
                      {title}
                    </p>
                    <p className="mt-0.5 text-mono-sm text-neutral-500">
                      {formatRelative(n.created_at)}
                    </p>
                  </div>
                  <Icon icon={Bell} size="sm" className="mt-1 shrink-0 text-neutral-400" />
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
