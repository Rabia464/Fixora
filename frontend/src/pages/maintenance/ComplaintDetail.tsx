import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  MapPin,
  Building2,
  Calendar,
  RefreshCw,
  Play,
  CheckCircle,
} from 'lucide-react'
import { complaintsApi } from '@/lib/api/complaints'
import { useUiStore } from '@/stores/ui-store'
import type {
  Complaint,
  AuditLog,
  MaintenanceProgressRequest,
  MaintenanceResolveRequest,
} from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { StatusChip } from '@/components/ui/StatusChip'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { Icon } from '@/components/ui/Icon'
import { Textarea } from '@/components/ui/Textarea'
import { Dialog } from '@/components/ui/Dialog'
import { Timeline, type TimelineItem, type TimelineItemVariant } from '@/components/ui/Timeline'
import type { ComplaintStatus } from '@/lib/tokens'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function mapAuditAction(action: string): { label: string; variant: TimelineItemVariant } {
  switch (action) {
    case 'TicketCreated': return { label: 'Complaint submitted', variant: 'brand' }
    case 'SupervisorReviewed': return { label: 'Reviewed by supervisor', variant: 'info' }
    case 'SupervisorOverride': return { label: 'AI recommendation overridden', variant: 'info' }
    case 'ForwardedToMaintenance': return { label: 'Forwarded to maintenance', variant: 'info' }
    case 'StatusUpdated': return { label: 'Status updated', variant: 'default' }
    case 'StudentConfirmed': return { label: 'Resolution confirmed by student', variant: 'success' }
    case 'StudentReopened': return { label: 'Complaint reopened by student', variant: 'warning' }
    case 'SystemAutoClosed': return { label: 'Automatically closed by system', variant: 'default' }
    default: return { label: action.replace(/([A-Z])/g, ' $1').trim(), variant: 'default' }
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaItem({
  icon: Glyph,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-100">
        <Glyph size={16} strokeWidth={1.75} className="text-neutral-500" />
      </div>
      <div className="min-w-0">
        <p className="text-caption font-semibold uppercase tracking-widest text-neutral-400">{label}</p>
        <p className="mt-0.5 text-body-sm font-medium text-neutral-800">{value}</p>
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

// ─── Mark In Progress Dialog ──────────────────────────────────────────────────

interface ProgressDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (data: MaintenanceProgressRequest) => Promise<void>
  loading: boolean
}

function ProgressDialog({ open, onClose, onConfirm, loading }: ProgressDialogProps) {
  const [note, setNote] = useState('')

  function handleClose() { setNote(''); onClose() }
  async function handleConfirm() { await onConfirm({ note: note.trim() || undefined }); setNote('') }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Mark as In Progress"
      description="Confirm that you are starting work on this complaint. You can optionally add a note."
      size="sm"
      footer={
        <>
          <Button variant="tertiary" size="md" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="brand" size="md" onClick={handleConfirm} loading={loading}>
            <Icon icon={Play} size="sm" />
            Confirm
          </Button>
        </>
      }
    >
      <div className="mt-2">
        <Textarea
          id="progress-note"
          name="progress-note"
          label="Note (optional)"
          placeholder="e.g. Coordinating with the plumbing team."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          disabled={loading}
          className="resize-none"
        />
      </div>
    </Dialog>
  )
}

// ─── Resolve Dialog ───────────────────────────────────────────────────────────

interface ResolveDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (data: MaintenanceResolveRequest) => Promise<void>
  loading: boolean
}

function ResolveDialog({ open, onClose, onConfirm, loading }: ResolveDialogProps) {
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | undefined>()

  function handleClose() { setNote(''); setError(undefined); onClose() }

  async function handleConfirm() {
    if (note.trim().length < 5) {
      setError('Resolution note must be at least 5 characters.')
      return
    }
    setError(undefined)
    await onConfirm({ resolution_note: note.trim() })
    setNote('')
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Resolve Complaint"
      description="Provide a summary of the work completed. The student will be notified and asked to confirm the resolution."
      size="sm"
      footer={
        <>
          <Button variant="tertiary" size="md" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="brand" size="md" onClick={handleConfirm} loading={loading}>
            <Icon icon={CheckCircle} size="sm" />
            Mark Resolved
          </Button>
        </>
      }
    >
      <div className="mt-2">
        <Textarea
          id="resolve-note"
          name="resolve-note"
          label="Resolution Note"
          placeholder="e.g. Replaced the broken tap and tested water flow. Area cleaned up."
          value={note}
          onChange={(e) => { setNote(e.target.value); if (error) setError(undefined) }}
          error={error}
          rows={4}
          disabled={loading}
          className="resize-none"
          required
        />
      </div>
    </Dialog>
  )
}

// ─── Complaint Detail ─────────────────────────────────────────────────────────

export function MaintenanceComplaintDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const pushToast = useUiStore((state) => state.pushToast)

  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [progressOpen, setProgressOpen] = useState(false)
  const [progressLoading, setProgressLoading] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [resolveLoading, setResolveLoading] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setError(null)
    try {
      const [c, logs] = await Promise.all([
        complaintsApi.get(id),
        complaintsApi.auditLogs(id),
      ])
      if (!cancelled) {
        setComplaint(c)
        setAuditLogs(logs)
      }
    } catch (err: unknown) {
      if (!cancelled) {
        const msg = err instanceof Error ? err.message : 'Failed to load complaint.'
        setError(msg)
      }
    } finally {
      if (!cancelled) setLoading(false)
    }
    return () => { cancelled = true }
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleProgress(data: MaintenanceProgressRequest) {
    if (!id) return
    setProgressLoading(true)
    try {
      const updated = await complaintsApi.progress(id, data)
      setComplaint(updated)
      setProgressOpen(false)
      const logs = await complaintsApi.auditLogs(id)
      setAuditLogs(logs)
      pushToast({ variant: 'success', title: 'Marked as In Progress' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status.'
      pushToast({ variant: 'danger', title: 'Error', description: msg })
    } finally {
      setProgressLoading(false)
    }
  }

  async function handleResolve(data: MaintenanceResolveRequest) {
    if (!id) return
    setResolveLoading(true)
    try {
      const updated = await complaintsApi.resolve(id, data)
      setComplaint(updated)
      setResolveOpen(false)
      const logs = await complaintsApi.auditLogs(id)
      setAuditLogs(logs)
      pushToast({
        variant: 'success',
        title: 'Complaint resolved',
        description: 'The student has been notified to confirm.',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resolve complaint.'
      pushToast({ variant: 'danger', title: 'Error', description: msg })
    } finally {
      setResolveLoading(false)
    }
  }

  const timelineItems: TimelineItem[] = auditLogs.map((log) => {
    const { label, variant } = mapAuditAction(log.action)
    return { id: log.id, action: label, timestamp: formatShort(log.created_at), variant }
  })

  const canProgress = complaint?.status === 'Forwarded'
  const canResolve = complaint?.status === 'InProgress'

  if (loading) {
    return <div className="max-w-3xl"><DetailSkeleton /></div>
  }

  if (error || !complaint) {
    return (
      <div className="max-w-3xl flex flex-col gap-4">
        <button
          type="button"
          onClick={() => navigate('/maintenance/assigned')}
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors focus:outline-none focus-visible:shadow-[var(--color-focus-ring)] rounded-md px-1 -ml-1 w-fit"
        >
          <Icon icon={ChevronLeft} size="sm" />
          Back to Assigned
        </button>
        <Alert
          variant="danger"
          title="Unable to load complaint"
          description={error ?? 'Complaint not found.'}
        />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-8 max-w-3xl">

        {/* ── Navigation ── */}
        <button
          type="button"
          onClick={() => navigate('/maintenance/assigned')}
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors focus:outline-none focus-visible:shadow-[var(--color-focus-ring)] rounded-md px-1 -ml-1 w-fit"
        >
          <Icon icon={ChevronLeft} size="sm" />
          Back to Assigned
        </button>

        {/* ── Page Header ── */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start gap-3">
            <Text variant="h1" as="h1" className="flex-1 text-neutral-900">
              {complaint.title}
            </Text>
            <StatusChip status={complaint.status as ComplaintStatus} className="mt-1 sm:mt-1.5" />
          </div>
          <Text variant="body-md" className="text-neutral-600 leading-relaxed">
            {complaint.description}
          </Text>
        </div>

        {/* ── Metadata ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetaItem icon={Building2} label="Hostel" value={complaint.hostel} />
          <MetaItem icon={MapPin} label="Location" value={complaint.location} />
          <MetaItem icon={Calendar} label="Filed" value={formatDate(complaint.created_at)} />
          <MetaItem icon={RefreshCw} label="Last updated" value={formatDate(complaint.updated_at)} />
        </div>

        {/* ── Supervisor Notes (overridden values if any) ── */}
        {complaint.supervisor_override && (
          <section aria-labelledby="sv-notes-heading">
            <Text variant="h3" as="h2" id="sv-notes-heading" className="mb-3 text-neutral-800">
              Supervisor Notes
            </Text>
            <div className="rounded-lg border border-border-default bg-bg-card p-4 flex flex-col gap-3">
              {complaint.overridden_category && (
                <div>
                  <p className="text-caption font-semibold uppercase tracking-widest text-neutral-400">Category</p>
                  <p className="mt-0.5 text-body-sm font-medium text-neutral-800">{complaint.overridden_category}</p>
                </div>
              )}
              {complaint.overridden_priority && (
                <div>
                  <p className="text-caption font-semibold uppercase tracking-widest text-neutral-400">Priority</p>
                  <p className="mt-0.5 text-body-sm font-medium text-neutral-800">{complaint.overridden_priority}</p>
                </div>
              )}
              {complaint.overridden_department && (
                <div>
                  <p className="text-caption font-semibold uppercase tracking-widest text-neutral-400">Department</p>
                  <p className="mt-0.5 text-body-sm font-medium text-neutral-800">{complaint.overridden_department}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Maintenance Actions ── */}
        {(canProgress || canResolve) && (
          <section aria-labelledby="actions-heading">
            <Text variant="h3" as="h2" id="actions-heading" className="mb-4 text-neutral-800">
              Actions
            </Text>

            {canProgress && (
              <Alert
                variant="info"
                title="This complaint is awaiting your action."
                description="Mark it as In Progress once you have begun working on it."
                className="mb-4"
              />
            )}

            {canResolve && (
              <Alert
                variant="warning"
                title="This task is in progress."
                description="Mark it as resolved once the work is fully complete."
                className="mb-4"
              />
            )}

            <div className="flex flex-wrap gap-3">
              {canProgress && (
                <Button
                  variant="brand"
                  size="md"
                  onClick={() => setProgressOpen(true)}
                >
                  <Icon icon={Play} size="sm" />
                  Mark In Progress
                </Button>
              )}
              {canResolve && (
                <Button
                  variant="brand"
                  size="md"
                  onClick={() => setResolveOpen(true)}
                >
                  <Icon icon={CheckCircle} size="sm" />
                  Resolve Complaint
                </Button>
              )}
            </div>
          </section>
        )}

        {/* ── Activity Timeline ── */}
        <section aria-labelledby="timeline-heading">
          <Text variant="h3" as="h2" id="timeline-heading" className="mb-4 text-neutral-800">
            Activity
          </Text>
          {timelineItems.length > 0 ? (
            <Timeline items={timelineItems} />
          ) : (
            <Text variant="body-sm" className="text-neutral-500">
              No activity recorded yet.
            </Text>
          )}
        </section>

      </div>

      {/* ── Dialogs ── */}
      <ProgressDialog
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
        onConfirm={handleProgress}
        loading={progressLoading}
      />
      <ResolveDialog
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        onConfirm={handleResolve}
        loading={resolveLoading}
      />
    </>
  )
}
