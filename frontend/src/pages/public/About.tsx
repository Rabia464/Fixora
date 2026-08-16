import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { PublicNavbar } from '@/components/ui/PublicNavbar'
import { cn } from '@/lib/cn'
import {
  MessageSquare,
  Cpu,
  UserCheck,
  Wrench,
  CheckCircle,
  ArrowRight,
  Tag,
  AlertTriangle,
  Building2,
  ChevronRight,
} from 'lucide-react'

// ─── Scroll-reveal hook ───────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visible }
}

// ─── Animated AI row ──────────────────────────────────────────────────────────
function AIRow({
  icon,
  label,
  value,
  delay,
  visible,
}: {
  icon: React.ReactNode
  label: string
  value: string
  delay: number
  visible: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 transition-all duration-500',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-primary-subtle text-brand-primary">
        {icon}
      </span>
      <span className="text-body-sm text-neutral-500 w-24 shrink-0">{label}</span>
      <ChevronRight size={14} className="text-neutral-400 shrink-0" />
      <span
        className="rounded-md bg-brand-primary-subtle px-2 py-0.5 text-body-sm font-semibold text-brand-primary border border-[var(--color-border-status-open)]"
      >
        {value}
      </span>
    </div>
  )
}

// ─── Status pill ──────────────────────────────────────────────────────────────
type PillStatus = 'Forwarded' | 'InProgress' | 'Resolved'
const pillStyles: Record<PillStatus, string> = {
  Forwarded:
    'bg-[var(--color-info-subtle)] text-[var(--color-info-default)] border-[var(--color-border-status-forwarded)]',
  InProgress:
    'bg-[var(--color-action-subtle)] text-[var(--color-action-ink)] border-[var(--color-border-status-in-progress)]',
  Resolved:
    'bg-[var(--color-success-subtle)] text-[var(--color-success-default)] border-[var(--color-border-status-resolved)]',
}
function StatusPill({
  status,
  active,
  delay,
  visible,
}: {
  status: PillStatus
  active: boolean
  delay: number
  visible: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 transition-all duration-500',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span
        className={cn(
          'inline-flex h-7 items-center rounded-md border px-3 text-caption font-semibold transition-all duration-300',
          pillStyles[status],
          active ? 'ring-2 ring-offset-2 ring-brand-primary scale-105' : 'opacity-60',
        )}
      >
        {status === 'InProgress' ? 'In Progress' : status}
      </span>
      {active && (
        <span className="h-1 w-1 rounded-full bg-brand-primary animate-pulse" />
      )}
    </div>
  )
}

// ─── Section wrapper with scroll-reveal ──────────────────────────────────────
function RevealSection({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { ref, visible } = useReveal()
  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-[var(--ease-emphasized)]',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ─── Step label (01 Report → 02 Analyze …) ───────────────────────────────────
function LifecycleStep({
  num,
  label,
  icon,
  active,
}: {
  num: string
  label: string
  icon: React.ReactNode
  active?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 transition-all duration-300',
        active ? 'opacity-100' : 'opacity-40',
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300',
          active
            ? 'bg-brand-primary text-neutral-0 border-brand-primary shadow-[0_0_0_4px_var(--color-brand-primary-subtle)]'
            : 'bg-neutral-100 text-neutral-400 border-neutral-300',
        )}
      >
        {icon}
      </div>
      <span className="font-mono text-caption text-neutral-500">{num}</span>
      <span className="text-body-sm font-semibold text-neutral-700">{label}</span>
    </div>
  )
}

// ─── Main About page ──────────────────────────────────────────────────────────
export function About() {
  const navigate = useNavigate()

  // Animated lifecycle tracker
  const { ref: lifecycleRef, visible: lifecycleVisible } = useReveal(0.2)
  const [activeStep, setActiveStep] = useState(0)
  useEffect(() => {
    if (!lifecycleVisible) return
    const steps = [0, 1, 2, 3, 4]
    steps.forEach((step, i) => {
      setTimeout(() => setActiveStep(step), i * 800)
    })
  }, [lifecycleVisible])

  // AI section step reveal
  const { ref: aiRef, visible: aiVisible } = useReveal()

  // Maintenance section
  const { ref: maintRef, visible: maintVisible } = useReveal()
  const [activePill, setActivePill] = useState(0)
  useEffect(() => {
    if (!maintVisible) return
    const pills: number[] = [0, 1, 2]
    pills.forEach((pill, i) => {
      setTimeout(() => setActivePill(pill), i * 900)
    })
  }, [maintVisible])

  return (
    <div className="min-h-screen bg-bg-app">
      <PublicNavbar />

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative px-4 pb-24 pt-20 sm:px-8">
        {/* Subtle background orb */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div
            className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, var(--color-brand-primary) 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-glass)] bg-[var(--color-bg-surface-raised)] px-3 py-1 text-caption font-semibold text-brand-primary backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
            GIKI Hostel Maintenance Platform
          </span>

          <Text
            variant="display-lg"
            as="h1"
            className="mb-5 text-neutral-900"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            About Fixora
          </Text>

          <Text variant="body-lg" className="mx-auto max-w-xl text-neutral-500">
            A smarter way to report, route, and resolve hostel maintenance
            problems — connecting students, supervisors, and maintenance teams
            through one transparent workflow.
          </Text>
        </div>
      </section>

      {/* ── 2. THE PROBLEM ──────────────────────────────────────────────────── */}
      <RevealSection>
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-8">
          <p className="mb-3 text-caption font-semibold uppercase tracking-widest text-neutral-400">
            The Problem
          </p>
          <Text variant="h2" className="mb-10 max-w-lg text-neutral-800">
            A maintenance problem shouldn&apos;t disappear into a message box.
          </Text>

          {/* Complaint bubble */}
          <GlassSurface
            elevation="modal"
            className="relative inline-flex max-w-sm flex-col gap-3 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 text-caption font-semibold text-neutral-500">
              <MessageSquare size={14} className="text-brand-primary" />
              Student complaint · Room 204, Block C
            </div>
            <p className="text-body-md text-neutral-800 leading-relaxed">
              &ldquo;The electrical socket near my desk is sparking. It&apos;s been this
              way for two days and I&apos;m unable to charge my laptop.&rdquo;
            </p>
            <div className="flex items-center gap-1.5 text-caption text-neutral-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-brand-primary)] animate-pulse" />
              Just submitted
            </div>
          </GlassSurface>
        </section>
      </RevealSection>

      {/* ── 3. AI ANALYSIS ──────────────────────────────────────────────────── */}
      <RevealSection>
        <section className="bg-neutral-50 px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 text-caption font-semibold uppercase tracking-widest text-neutral-400">
              AI Analysis
            </p>
            <Text variant="h2" className="mb-2 text-neutral-800">
              Analyzing the complaint…
            </Text>
            <Text variant="body-md" className="mb-10 text-neutral-500">
              Fixora&apos;s analysis engine reads the complaint and produces an
              initial assessment for supervisor review.
            </Text>

            <div ref={aiRef}>
              <GlassSurface
                elevation="dropdown"
                className="inline-flex flex-col gap-4 rounded-2xl p-6"
              >
                <p className="text-caption font-semibold uppercase tracking-widest text-neutral-400">
                  System assessment
                </p>
                <AIRow
                  icon={<Tag size={13} />}
                  label="Category"
                  value="Electrical"
                  delay={0}
                  visible={aiVisible}
                />
                <AIRow
                  icon={<AlertTriangle size={13} />}
                  label="Priority"
                  value="Critical"
                  delay={220}
                  visible={aiVisible}
                />
                <AIRow
                  icon={<Building2 size={13} />}
                  label="Department"
                  value="Electrical Maintenance"
                  delay={440}
                  visible={aiVisible}
                />
              </GlassSurface>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ── 4. SUPERVISOR REVIEW ────────────────────────────────────────────── */}
      <RevealSection>
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-8">
          <p className="mb-3 text-caption font-semibold uppercase tracking-widest text-neutral-400">
            Supervisor Review
          </p>
          <Text variant="h2" className="mb-2 text-neutral-800">
            AI assists. Humans decide.
          </Text>
          <Text variant="body-md" className="mb-10 max-w-lg text-neutral-500">
            A hostel supervisor reviews the AI assessment — verifying the
            category, adjusting priority if needed, and routing the complaint to
            the correct maintenance team.
          </Text>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            {/* AI card */}
            <GlassSurface elevation="dropdown" className="flex-1 rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary-subtle">
                  <Cpu size={14} className="text-brand-primary" />
                </div>
                <span className="text-body-sm font-semibold text-neutral-700">
                  System suggestion
                </span>
              </div>
              <div className="space-y-1.5 text-body-sm text-neutral-600">
                <p>Category: <strong className="text-neutral-800">Electrical</strong></p>
                <p>Priority: <strong className="text-neutral-800">Critical</strong></p>
                <p>Department: <strong className="text-neutral-800">Electrical Maint.</strong></p>
              </div>
            </GlassSurface>

            {/* Arrow */}
            <div className="flex items-center justify-center py-3 sm:py-8">
              <ArrowRight size={20} className="text-neutral-300 rotate-90 sm:rotate-0" />
            </div>

            {/* Supervisor action */}
            <GlassSurface elevation="modal" className="flex-1 rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary-subtle">
                  <UserCheck size={14} className="text-brand-primary" />
                </div>
                <span className="text-body-sm font-semibold text-neutral-700">
                  Supervisor validated
                </span>
              </div>
              <p className="text-body-sm text-neutral-600">
                Assessment confirmed. Complaint forwarded to the{' '}
                <strong className="text-neutral-800">Electrical Maintenance</strong>{' '}
                team with <strong className="text-neutral-800">Critical</strong> priority.
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-caption text-[var(--color-success-default)]">
                <CheckCircle size={13} />
                Dispatched
              </div>
            </GlassSurface>
          </div>
        </section>
      </RevealSection>

      {/* ── 5. MAINTENANCE RESOLUTION ───────────────────────────────────────── */}
      <RevealSection>
        <section className="bg-neutral-50 px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 text-caption font-semibold uppercase tracking-widest text-neutral-400">
              Maintenance
            </p>
            <Text variant="h2" className="mb-2 text-neutral-800">
              From dispatch to resolution.
            </Text>
            <Text variant="body-md" className="mb-10 text-neutral-500">
              Maintenance staff pick up the ticket, update progress in real
              time, and mark it resolved. The student is notified at each step.
            </Text>

            <div ref={maintRef} className="flex items-center gap-6 sm:gap-10">
              <StatusPill
                status="Forwarded"
                active={activePill >= 0}
                delay={0}
                visible={maintVisible}
              />
              <div
                className={cn(
                  'h-px flex-1 bg-neutral-300 transition-all duration-500',
                  maintVisible ? 'opacity-100' : 'opacity-0',
                )}
                style={{ transitionDelay: '300ms' }}
              />
              <StatusPill
                status="InProgress"
                active={activePill >= 1}
                delay={400}
                visible={maintVisible}
              />
              <div
                className={cn(
                  'h-px flex-1 bg-neutral-300 transition-all duration-500',
                  maintVisible ? 'opacity-100' : 'opacity-0',
                )}
                style={{ transitionDelay: '700ms' }}
              />
              <StatusPill
                status="Resolved"
                active={activePill >= 2}
                delay={800}
                visible={maintVisible}
              />
            </div>

            {/* Maintenance note */}
            <div
              className={cn(
                'mt-10 transition-all duration-500',
                maintVisible && activePill >= 2
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4',
              )}
              style={{ transitionDelay: '1600ms' }}
            >
              <GlassSurface elevation="dropdown" className="inline-flex max-w-sm flex-col gap-2 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-caption font-semibold text-[var(--color-success-default)]">
                  <Wrench size={13} />
                  Maintenance update
                </div>
                <p className="text-body-sm text-neutral-700">
                  Socket replaced and earthing tested. Issue fully resolved.
                </p>
                <p className="text-caption text-neutral-400">
                  Student notified via platform notification.
                </p>
              </GlassSurface>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ── 6. LIFECYCLE OVERVIEW ───────────────────────────────────────────── */}
      <RevealSection>
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-8">
          <p className="mb-3 text-caption font-semibold uppercase tracking-widest text-neutral-400">
            The Complete Lifecycle
          </p>
          <Text variant="h2" className="mb-10 text-neutral-800">
            One complaint. One transparent journey.
          </Text>

          <div
            ref={lifecycleRef}
            className="flex flex-wrap items-start justify-center gap-4 sm:flex-nowrap sm:gap-0"
          >
            {[
              { num: '01', label: 'Report', icon: <MessageSquare size={16} /> },
              { num: '02', label: 'Analyze', icon: <Cpu size={16} /> },
              { num: '03', label: 'Review', icon: <UserCheck size={16} /> },
              { num: '04', label: 'Dispatch', icon: <Wrench size={16} /> },
              { num: '05', label: 'Resolve', icon: <CheckCircle size={16} /> },
            ].map((step, i) => (
              <div key={step.num} className="flex items-center">
                <LifecycleStep {...step} active={activeStep >= i} />
                {i < 4 && (
                  <div
                    className={cn(
                      'mx-2 hidden h-px w-8 shrink-0 bg-neutral-300 transition-all duration-500 sm:block',
                      activeStep > i ? 'bg-brand-primary opacity-100' : 'opacity-40',
                    )}
                    style={{ transitionDelay: `${i * 800 + 400}ms` }}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      </RevealSection>

      {/* ── 7. PRODUCT VALUE ────────────────────────────────────────────────── */}
      <RevealSection>
        <section className="bg-neutral-50 px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 text-caption font-semibold uppercase tracking-widest text-neutral-400">
              Built for campus living
            </p>
            <Text variant="h2" className="mb-10 text-neutral-800">
              One platform. Every stakeholder.
            </Text>

            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  label: 'Students',
                  desc: 'Report hostel problems in seconds. Track status updates from submission to resolution.',
                },
                {
                  label: 'Supervisors',
                  desc: 'Review system recommendations, validate categories, and route complaints to the right team.',
                },
                {
                  label: 'Maintenance',
                  desc: 'Receive assigned tickets, update progress, and communicate resolution status back to students.',
                },
              ].map(({ label, desc }) => (
                <div key={label} className="flex flex-col gap-3">
                  <div className="h-px w-8 bg-brand-primary" />
                  <Text variant="h4" className="text-neutral-800">
                    {label}
                  </Text>
                  <Text variant="body-sm" className="text-neutral-500 leading-relaxed">
                    {desc}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ── 8. FINAL CTA ────────────────────────────────────────────────────── */}
      <RevealSection>
        <section className="px-4 py-24 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <GlassSurface elevation="modal" className="rounded-3xl px-8 py-14">
              <Text
                variant="h1"
                as="h2"
                className="mb-3 text-neutral-900"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Ready to report a problem?
              </Text>
              <Text variant="body-lg" className="mb-8 text-neutral-500">
                Sign in to your Fixora account and submit a maintenance complaint.
              </Text>
              <Button
                variant="brand"
                size="lg"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2"
              >
                Login to Fixora
                <ArrowRight size={16} />
              </Button>
            </GlassSurface>
          </div>
        </section>
      </RevealSection>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-200 px-4 py-8 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Text variant="caption" className="text-neutral-400">
            © {new Date().getFullYear()} Fixora. All rights reserved.
          </Text>
          <a
            href=""
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-caption text-neutral-400 no-underline transition-colors duration-[var(--motion-fast)] hover:text-neutral-700 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2"
            aria-label="Fixora on GitHub"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
