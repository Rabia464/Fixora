/**
 * Token constants mirroring docs/design_system.md.
 * Prefer CSS variables / Tailwind token classes in UI.
 * Use these for JS-side logic (status maps, icon sizes).
 */

export const iconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const

export type IconSize = keyof typeof iconSize

export const iconStroke = {
  default: 1.75,
  xl: 1.5,
} as const

/** Complaint status → chip token mapping (design_system.md §1.3) */
export const statusChipTokens = {
  Open: {
    bg: 'var(--color-brand-primary-subtle)',
    fg: 'var(--color-brand-primary)',
    border: 'var(--color-border-status-open)',
  },
  UnderReview: {
    bg: 'var(--color-brand-primary-subtle)',
    fg: 'var(--color-brand-primary)',
    border: 'var(--color-border-status-open)',
  },
  Forwarded: {
    bg: 'var(--color-info-subtle)',
    fg: 'var(--color-info-default)',
    border: 'var(--color-border-status-forwarded)',
  },
  InProgress: {
    bg: 'var(--color-action-subtle)',
    fg: 'var(--color-action-ink)',
    border: 'var(--color-border-status-in-progress)',
  },
  Resolved: {
    bg: 'var(--color-success-subtle)',
    fg: 'var(--color-success-default)',
    border: 'var(--color-border-status-resolved)',
  },
  Closed: {
    bg: 'var(--color-neutral-100)',
    fg: 'var(--color-neutral-700)',
    border: 'var(--color-border-default)',
  },
  Reopened: {
    bg: 'var(--color-warning-subtle)',
    fg: 'var(--color-warning-default)',
    border: 'var(--color-border-status-reopened)',
  },
} as const

export type ComplaintStatus = keyof typeof statusChipTokens
