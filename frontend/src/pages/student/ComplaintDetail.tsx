import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, MapPin, Building2, Calendar, RefreshCw } from 'lucide-react'
import { complaintsApi } from '@/lib/api/complaints'
import { useUiStore } from '@/stores/ui-store'
import type { Complaint, AuditLog } from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { StatusChip } from '@/components/ui/StatusChip'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { Icon } from '@/components/ui/Icon'
import { Timeline, type TimelineItem, type TimelineItemVariant } from '@/components/ui/Timeline'
import { AIRecommendationCard, type AIField } from '@/components/ui/AIRecommendationCard'
import { Dialog } from '@/components/ui/Dialog'
import { Textarea } from '@/components/ui/Textarea'
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

/** Map an AuditAction string to a human-readable label and variant. */
function mapAuditAction(action: string): { label: string; variant: TimelineItemVariant } {
  switch (action) {
    case 'TicketCreated':
      return { label: 'Complaint submitted', variant: 'brand' }
    case 'SupervisorReviewed':
      return { label: 'Reviewed by supervisor', variant: 'info' }
    case 'SupervisorOverride':
      return { label: 'AI recommendation overridden by supervisor', variant: 'info' }
    case 'ForwardedToMaintenance':
      return { label: 'Forwarded to maintenance team', variant: 'info' }
    case 'StatusUpdated':
      return { label: 'Status updated', variant: 'default' }
    case 'StudentConfirmed':
      return { label: 'Resolution confirmed by student', variant: 'success' }
    case 'StudentReopened':
      return { label: 'Complaint reopened by student', variant: 'warning' }
    case 'SystemAutoClosed':
      return { label: 'Automatically closed by system', variant: 'default' }
    default:
      return { label: action.replace(/([A-Z])/g, ' $1').trim(), variant: 'default' }
  }
}

// ─── Metadata Item ────────────────────────────────────────────────────────────

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
        <p className="text-caption font-semibold uppercase tracking-widest text-neutral-400">
          {label}
        </p>
        <p className="mt-0.5 text-body-sm font-medium text-neutral-800">{value}</p>
      </div>
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

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
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

// ─── Reopen Dialog ────────────────────────────────────────────────────────────

interface ReopenDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
  loading: boolean
}

function ReopenDialog({ open, onClose, onConfirm, loading }: ReopenDialogProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | undefined>()

  async function handleSubmit() {
    if (reason.trim().length < 10) {
      setError('Please provide at least 10 characters explaining why you are reopening.')
      return
    }
    setError(undefined)
    await onConfirm(reason.trim())
  }

  function handleClose() {
    setReason('')
    setError(undefined)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Reopen Complaint"
      description="Please explain why this complaint needs to be reopened. This will be visible to the supervisor."
      size="sm"
      footer={
        <>
          <Button variant="tertiary" size="md" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="brand" size="md" onClick={handleSubmit} loading={loading}>
            Submit
          </Button>
        </>
      }
    >
      <div className="mt-2">
        <Textarea
          id="reopen-reason"
          name="reopen-reason"
          label="Reason for reopening"
          placeholder="e.g. The issue was not fully resolved — the pipe is still leaking."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            if (error) setError(undefined)
          }}
          error={error}
          rows={4}
          disabled={loading}
          className="resize-none"
        />
      </div>
    </Dialog>
  )
}

// ─── Complaint Detail ─────────────────────────────────────────────────────────

export function ComplaintDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const pushToast = useUiStore((state) => state.pushToast)

  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [confirming, setConfirming] = useState(false)
  const [reopenOpen, setReopenOpen] = useState(false)
  const [reopenLoading, setReopenLoading] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [c, logs] = await Promise.all([
        complaintsApi.get(id),
        complaintsApi.auditLogs(id),
      ])
      setComplaint(c)
      setAuditLogs(logs)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load complaint.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleConfirm() {
    if (!id) return
    setConfirming(true)
    try {
      const updated = await complaintsApi.confirm(id)
      setComplaint(updated)
      pushToast({ variant: 'success', title: 'Resolution confirmed', description: 'The complaint has been closed.' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm resolution.'
      pushToast({ variant: 'danger', title: 'Error', description: msg })
    } finally {
      setConfirming(false)
    }
  }

  async function handleReopen(reason: string) {
    if (!id) return
    setReopenLoading(true)
    try {
      const updated = await complaintsApi.reopen(id, { reason })
      setComplaint(updated)
      setReopenOpen(false)
      pushToast({ variant: 'info', title: 'Complaint reopened', description: 'Your complaint has been submitted for re-review.' })
      // Reload audit logs to reflect the new entry
      const logs = await complaintsApi.auditLogs(id)
      setAuditLogs(logs)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reopen complaint.'
      pushToast({ variant: 'danger', title: 'Error', description: msg })
    } finally {
      setReopenLoading(false)
    }
  }

  // ── Build AI fields ─────────────────────────────────────────────────────────
  const aiFields: AIField[] = complaint ? [
    { label: 'Category', value: complaint.ai_category ?? '—' },
    { label: 'Priority', value: complaint.ai_priority ?? '—' },
    { label: 'Department', value: complaint.ai_department ?? '—' },
  ] : []

  // ── Build Timeline items from audit logs ────────────────────────────────────
  const timelineItems: TimelineItem[] = auditLogs.map((log) => {
    const { label, variant } = mapAuditAction(log.action)
    return {
      id: log.id,
      action: label,
      timestamp: formatShort(log.created_at),
      variant,
    }
  })

  const canConfirm = complaint?.status === 'Resolved'
  const canReopen = complaint?.status === 'Resolved' || complaint?.status === 'Closed' || complaint?.status === 'Reopened'

  if (loading) {
    return (
      <div className="max-w-3xl">
        <DetailSkeleton />
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <div className="max-w-3xl flex flex-col gap-4">
        <button
          type="button"
          onClick={() => navigate('/student')}
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors focus:outline-none focus-visible:shadow-[var(--color-focus-ring)] rounded-md px-1 -ml-1 w-fit"
        >
          <Icon icon={ChevronLeft} size="sm" />
          Back to Dashboard
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
          onClick={() => navigate('/student')}
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors focus:outline-none focus-visible:shadow-[var(--color-focus-ring)] rounded-md px-1 -ml-1 w-fit"
        >
          <Icon icon={ChevronLeft} size="sm" />
          Back to Dashboard
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

        {/* ── Metadata Grid ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetaItem icon={Building2} label="Hostel" value={complaint.hostel} />
          <MetaItem icon={MapPin} label="Location" value={complaint.location} />
          <MetaItem icon={Calendar} label="Filed" value={formatDate(complaint.created_at)} />
          <MetaItem icon={RefreshCw} label="Last updated" value={formatDate(complaint.updated_at)} />
        </div>

        {/* ── AI Recommendation ── */}
        {(complaint.ai_category || complaint.ai_priority || complaint.ai_department) && (
          <section aria-labelledby="ai-heading">
            <Text variant="h3" as="h2" id="ai-heading" className="mb-3 text-neutral-800">
              AI Assessment
            </Text>
            <AIRecommendationCard
              fields={aiFields}
              helperText="Assessed automatically by the AI system. Final routing is determined by your hostel supervisor."
            />
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

        {/* ── Student Actions ── */}
        {(canConfirm || canReopen) && (
          <section aria-labelledby="actions-heading">
            <Text variant="h3" as="h2" id="actions-heading" className="mb-4 text-neutral-800">
              Actions
            </Text>

            {canConfirm && (
              <Alert
                variant="success"
                title="This complaint has been marked as resolved."
                description="If the issue has been fully addressed, please confirm the resolution to close this ticket."
                className="mb-4"
              />
            )}

            <div className="flex flex-wrap gap-3">
              {canConfirm && (
                <Button
                  variant="brand"
                  size="md"
                  onClick={handleConfirm}
                  loading={confirming}
                >
                  Confirm Resolution
                </Button>
              )}
              <Button
                variant="secondary"
                size="md"
                onClick={() => setReopenOpen(true)}
                disabled={confirming}
              >
                <Icon icon={RefreshCw} size="sm" />
                Reopen Complaint
              </Button>
            </div>
          </section>
        )}

      </div>

      {/* ── Reopen Dialog ── */}
      <ReopenDialog
        open={reopenOpen}
        onClose={() => setReopenOpen(false)}
        onConfirm={handleReopen}
        loading={reopenLoading}
      />
    </>
  )
}
