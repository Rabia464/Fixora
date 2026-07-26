import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  MapPin,
  Building2,
  Calendar,
  RefreshCw,
  Send,
  Save,
} from 'lucide-react'
import { complaintsApi } from '@/lib/api/complaints'
import { useUiStore } from '@/stores/ui-store'
import type {
  Complaint,
  AuditLog,
  SupervisorReviewRequest,
  ComplaintPriority,
} from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { StatusChip } from '@/components/ui/StatusChip'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { Icon } from '@/components/ui/Icon'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { Dialog } from '@/components/ui/Dialog'
import { Timeline, type TimelineItem, type TimelineItemVariant } from '@/components/ui/Timeline'
import { AIRecommendationCard, type AIField } from '@/components/ui/AIRecommendationCard'
import type { ComplaintStatus } from '@/lib/tokens'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS: { value: ComplaintPriority; label: string }[] = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
]

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
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

// ─── Review Form ──────────────────────────────────────────────────────────────

interface ReviewFormState {
  category: string
  priority: ComplaintPriority | ''
  department: string
}

interface ReviewFormProps {
  complaint: Complaint
  onSave: (data: SupervisorReviewRequest) => Promise<void>
  onForward: (data: SupervisorReviewRequest) => Promise<void>
  saving: boolean
  forwarding: boolean
}

function ReviewForm({ complaint, onSave, onForward, saving, forwarding }: ReviewFormProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Populate from AI values or existing overrides
  const [form, setForm] = useState<ReviewFormState>({
    category: complaint.overridden_category ?? complaint.ai_category ?? '',
    priority: complaint.overridden_priority ?? complaint.ai_priority ?? '',
    department: complaint.overridden_department ?? complaint.ai_department ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ReviewFormState, string>>>({})

  // Track dirty state against original AI values
  const isModified =
    form.category !== (complaint.ai_category ?? '') ||
    form.priority !== (complaint.ai_priority ?? '') ||
    form.department !== (complaint.ai_department ?? '')

  function validate(): boolean {
    const e: Partial<Record<keyof ReviewFormState, string>> = {}
    if (!form.category.trim() || form.category.trim().length < 2)
      e.category = 'Category must be at least 2 characters.'
    if (!form.priority)
      e.priority = 'Priority is required.'
    if (!form.department.trim() || form.department.trim().length < 2)
      e.department = 'Department must be at least 2 characters.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function buildPayload(): SupervisorReviewRequest {
    return {
      category: form.category.trim(),
      priority: form.priority as ComplaintPriority,
      department: form.department.trim(),
      override: isModified,
    }
  }

  async function handleSave() {
    if (!validate()) return
    await onSave(buildPayload())
  }

  async function handleForwardConfirm() {
    if (!validate()) { setConfirmOpen(false); return }
    setConfirmOpen(false)
    await onForward(buildPayload())
  }

  const isDisabled = saving || forwarding
  const isActionable = complaint.status === 'Open' || complaint.status === 'UnderReview' || complaint.status === 'Reopened'

  if (!isActionable) {
    return (
      <Alert
        variant="info"
        title="Review not available"
        description={`This complaint is currently ${complaint.status}. No supervisor action is available at this stage.`}
      />
    )
  }

  return (
    <>
      <div className="flex flex-col gap-5 rounded-lg border border-border-default bg-bg-card p-5">
        <div className="flex items-center justify-between">
          <Text variant="h3" as="h2" className="text-neutral-800">
            Supervisor Review
          </Text>
          {isModified && (
            <span className="text-caption font-medium text-warning-default bg-warning-subtle rounded-md px-2 py-0.5">
              Modified from AI suggestion
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Dropdown<ComplaintPriority>
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={form.priority as ComplaintPriority || null}
            onChange={(v) => {
              setForm((p) => ({ ...p, priority: v }))
              if (errors.priority) setErrors((p) => ({ ...p, priority: undefined }))
            }}
            error={errors.priority}
            disabled={isDisabled}
          />

          <Input
            label="Category"
            id="sv-category"
            name="sv-category"
            value={form.category}
            onChange={(e) => {
              setForm((p) => ({ ...p, category: e.target.value }))
              if (errors.category) setErrors((p) => ({ ...p, category: undefined }))
            }}
            error={errors.category}
            placeholder="e.g. Plumbing"
            disabled={isDisabled}
          />

          <Input
            label="Department"
            id="sv-department"
            name="sv-department"
            value={form.department}
            onChange={(e) => {
              setForm((p) => ({ ...p, department: e.target.value }))
              if (errors.department) setErrors((p) => ({ ...p, department: undefined }))
            }}
            error={errors.department}
            placeholder="e.g. Hostel Maintenance"
            disabled={isDisabled}
            className="sm:col-span-2"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Button
            variant="brand"
            size="md"
            onClick={() => setConfirmOpen(true)}
            loading={forwarding}
            disabled={saving}
          >
            <Icon icon={Send} size="sm" />
            Save & Forward to Maintenance
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleSave}
            loading={saving}
            disabled={forwarding}
          >
            <Icon icon={Save} size="sm" />
            Save Review
          </Button>
        </div>
      </div>

      {/* Forward Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Forward to Maintenance?"
        description="This will save your review and send the complaint to the Maintenance Office. The student will be notified. This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="tertiary" size="md" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="brand" size="md" onClick={handleForwardConfirm} loading={forwarding}>
              <Icon icon={Send} size="sm" />
              Confirm & Forward
            </Button>
          </>
        }
      />
    </>
  )
}

// ─── Complaint Detail ─────────────────────────────────────────────────────────

export function SupervisorComplaintDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const pushToast = useUiStore((state) => state.pushToast)

  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [forwarding, setForwarding] = useState(false)

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

  async function handleSave(data: SupervisorReviewRequest) {
    if (!id) return
    setSaving(true)
    try {
      const updated = await complaintsApi.review(id, data)
      setComplaint(updated)
      const logs = await complaintsApi.auditLogs(id)
      setAuditLogs(logs)
      pushToast({ variant: 'success', title: 'Review saved', description: 'Your assessment has been recorded.' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save review.'
      pushToast({ variant: 'danger', title: 'Error', description: msg })
    } finally {
      setSaving(false)
    }
  }

  async function handleForward(data: SupervisorReviewRequest) {
    if (!id) return
    setForwarding(true)
    try {
      // First save review, then forward
      await complaintsApi.review(id, data)
      const updated = await complaintsApi.forward(id)
      setComplaint(updated)
      const logs = await complaintsApi.auditLogs(id)
      setAuditLogs(logs)
      pushToast({
        variant: 'success',
        title: 'Forwarded to Maintenance',
        description: 'The complaint has been assigned to the maintenance team.',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to forward complaint.'
      pushToast({ variant: 'danger', title: 'Error', description: msg })
    } finally {
      setForwarding(false)
    }
  }

  const aiFields: AIField[] = complaint ? [
    { label: 'Category', value: complaint.ai_category ?? '—' },
    { label: 'Priority', value: complaint.ai_priority ?? '—' },
    { label: 'Department', value: complaint.ai_department ?? '—' },
  ] : []

  const timelineItems: TimelineItem[] = auditLogs.map((log) => {
    const { label, variant } = mapAuditAction(log.action)
    return { id: log.id, action: label, timestamp: formatShort(log.created_at), variant }
  })

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
          onClick={() => navigate('/supervisor/complaints')}
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors focus:outline-none focus-visible:shadow-[var(--color-focus-ring)] rounded-md px-1 -ml-1 w-fit"
        >
          <Icon icon={ChevronLeft} size="sm" />
          Back to Complaints
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
    <div className="flex flex-col gap-8 max-w-3xl">

      {/* ── Navigation ── */}
      <button
        type="button"
        onClick={() => navigate('/supervisor/complaints')}
        className="inline-flex items-center gap-1.5 text-body-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors focus:outline-none focus-visible:shadow-[var(--color-focus-ring)] rounded-md px-1 -ml-1 w-fit"
      >
        <Icon icon={ChevronLeft} size="sm" />
        Back to Complaints
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

      {/* ── AI Suggestion ── */}
      {(complaint.ai_category || complaint.ai_priority || complaint.ai_department) && (
        <section aria-labelledby="ai-heading">
          <Text variant="h3" as="h2" id="ai-heading" className="mb-3 text-neutral-800">
            AI Suggestion
          </Text>
          <AIRecommendationCard
            fields={aiFields}
            helperText="These values are pre-filled in the review form below. Modify them if the AI assessment is incorrect."
          />
        </section>
      )}

      {/* ── Supervisor Review Form ── */}
      <section aria-labelledby="review-heading">
        <ReviewForm
          complaint={complaint}
          onSave={handleSave}
          onForward={handleForward}
          saving={saving}
          forwarding={forwarding}
        />
      </section>

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
  )
}
