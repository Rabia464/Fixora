import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ImagePlus } from 'lucide-react'
import { complaintsApi } from '@/lib/api/complaints'
import { useUiStore } from '@/stores/ui-store'
import type { ComplaintCreate } from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Alert } from '@/components/ui/Alert'
import { Text } from '@/components/ui/Text'
import { Icon } from '@/components/ui/Icon'

// ─── Validation ───────────────────────────────────────────────────────────────

interface FormErrors {
  title?: string
  description?: string
  location?: string
}

function validate(data: ComplaintCreate): FormErrors {
  const errors: FormErrors = {}
  if (!data.title.trim() || data.title.trim().length < 5)
    errors.title = 'Title must be at least 5 characters.'
  if (data.title.trim().length > 255)
    errors.title = 'Title must be 255 characters or fewer.'
  if (!data.description.trim() || data.description.trim().length < 10)
    errors.description = 'Description must be at least 10 characters.'
  if (!data.location.trim() || data.location.trim().length < 3)
    errors.location = 'Location must be at least 3 characters.'
  if (data.location.trim().length > 255)
    errors.location = 'Location must be 255 characters or fewer.'
  return errors
}

// ─── Create Complaint Page ────────────────────────────────────────────────────

export function CreateComplaint() {
  const navigate = useNavigate()
  const pushToast = useUiStore((state) => state.pushToast)

  const [form, setForm] = useState<ComplaintCreate>({
    title: '',
    description: '',
    location: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(field: keyof ComplaintCreate) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      // Clear field error on change
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      const created = await complaintsApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
      })
      pushToast({
        variant: 'success',
        title: 'Complaint submitted',
        description: 'Your complaint has been received and will be reviewed shortly.',
      })
      navigate(`/student/complaints/${created.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed. Please try again.'
      setSubmitError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => navigate('/student')}
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors focus:outline-none focus-visible:shadow-[var(--color-focus-ring)] rounded-md px-1 -ml-1 w-fit"
        >
          <Icon icon={ChevronLeft} size="sm" />
          Back to Dashboard
        </button>
        <div>
          <Text variant="h1" as="h1" className="text-neutral-900">
            Submit a Complaint
          </Text>
          <Text variant="body-md" className="mt-1.5 text-neutral-500">
            Describe your issue clearly so it can be assessed and routed correctly.
          </Text>
        </div>
      </div>

      {submitError && (
        <Alert
          variant="danger"
          title="Submission failed"
          description={submitError}
          onDismiss={() => setSubmitError(null)}
        />
      )}

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

        <Input
          label="Title"
          id="title"
          name="title"
          placeholder="e.g. Broken tap in bathroom Block C, Room 204"
          value={form.title}
          onChange={handleChange('title')}
          error={errors.title}
          helperText="Brief summary of the issue (5–255 characters)."
          disabled={loading}
          maxLength={255}
          required
          autoFocus
        />

        <Textarea
          label="Description"
          id="description"
          name="description"
          placeholder="Describe the problem in detail — when it started, how severe it is, and any other relevant context."
          value={form.description}
          onChange={handleChange('description')}
          error={errors.description}
          helperText="Minimum 10 characters. Be as specific as possible."
          disabled={loading}
          rows={5}
          required
        />

        <Input
          label="Location"
          id="location"
          name="location"
          placeholder="e.g. Block C, Room 204, Ground Floor Bathroom"
          value={form.location}
          onChange={handleChange('location')}
          error={errors.location}
          helperText="Exact location within the hostel (3–255 characters)."
          disabled={loading}
          maxLength={255}
          required
        />

        {/* ── Image Attachment (Coming Soon) ── */}
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-caption font-semibold text-neutral-700">
            Attach Image
            <span className="ml-2 text-caption font-normal text-neutral-400">(coming soon)</span>
          </label>
          <div className="flex h-24 w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg border border-dashed border-border-default bg-bg-input opacity-50">
            <Icon icon={ImagePlus} size="md" className="text-neutral-400" />
            <Text variant="body-sm" className="text-neutral-400">
              Image upload is not yet available.
            </Text>
          </div>
          <Text variant="body-sm" className="text-neutral-400">
            Photo evidence support will be added in a future update.
          </Text>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="tertiary"
            size="md"
            onClick={() => navigate('/student')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="brand"
            size="md"
            loading={loading}
          >
            Submit Complaint
          </Button>
        </div>
      </form>
    </div>
  )
}
