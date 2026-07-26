import { useState } from 'react'
import {
  ClipboardList,
  Wrench,
  Bell,
  Settings,
  Home,
  RotateCcw,
  CircleCheck,
  Forward,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { SearchInput } from '@/components/ui/SearchInput'
import { Text } from '@/components/ui/Text'
import { Icon } from '@/components/ui/Icon'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Badge } from '@/components/ui/Badge'
import { StatusChip } from '@/components/ui/StatusChip'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { Dropdown } from '@/components/ui/Dropdown'
import { Dialog } from '@/components/ui/Dialog'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Navbar } from '@/components/ui/Navbar'
import { Sidebar } from '@/components/ui/Sidebar'
import { NotificationPanel } from '@/components/ui/NotificationPanel'
import { Timeline } from '@/components/ui/Timeline'
import { AIRecommendationCard } from '@/components/ui/AIRecommendationCard'
import type { ComplaintStatus } from '@/lib/tokens'

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Text variant="h2" className="shrink-0 text-neutral-800">{title}</Text>
        <div className="h-px flex-1 bg-border-default" />
      </div>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-[260px] flex-1 flex-col gap-4 rounded-lg border border-border-default bg-bg-surface p-5">
      <Text variant="h4" className="text-neutral-600">{title}</Text>
      {children}
    </div>
  )
}

// ─── Showcase ────────────────────────────────────────────────────────────────

const STATUSES: ComplaintStatus[] = [
  'Open', 'UnderReview', 'Forwarded', 'InProgress', 'Resolved', 'Closed', 'Reopened',
]

const TIMELINE_ITEMS = [
  { id: '1', action: 'Complaint submitted', actor: 'ali.raza@uni.edu', timestamp: '09:00 AM', variant: 'brand' as const },
  { id: '2', action: 'Status changed to Under Review', actor: 'supervisor@uni.edu', timestamp: '09:45 AM', variant: 'info' as const },
  { id: '3', action: 'Forwarded to Maintenance', actor: 'supervisor@uni.edu', timestamp: '10:30 AM', variant: 'default' as const },
  { id: '4', action: 'Resolved', actor: 'maintenance@uni.edu', timestamp: '02:15 PM', variant: 'success' as const },
]

const NOTIFICATIONS = [
  { id: '1', title: 'Your complaint #FIX-0042 was resolved', timestamp: '10 min ago', read: false },
  { id: '2', title: 'Supervisor forwarded #FIX-0039 to maintenance', body: 'Electrical issue in Block C', timestamp: '2 hrs ago', read: false },
  { id: '3', title: 'New complaint assigned to you', timestamp: 'Yesterday', read: true },
]

const SIDEBAR_SECTIONS = [
  {
    title: 'Main',
    items: [
      { id: 'home', label: 'Dashboard', icon: Home, active: true },
      { id: 'complaints', label: 'Complaints', icon: ClipboardList },
      { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    ],
  },
  {
    title: 'Account',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
]

const TABLE_ROWS = [
  { id: 'FIX-0042', title: 'Water leakage in Block A', status: 'Resolved' as ComplaintStatus, dept: 'Plumbing' },
  { id: 'FIX-0043', title: 'Broken window lock, Room 204', status: 'InProgress' as ComplaintStatus, dept: 'Electrical' },
  { id: 'FIX-0044', title: 'No hot water for 3 days', status: 'Open' as ComplaintStatus, dept: 'Plumbing' },
  { id: 'FIX-0045', title: 'Fan not working', status: 'Forwarded' as ComplaintStatus, dept: 'Electrical' },
]

export function UIShowcase() {
  const [search, setSearch] = useState('')
  const [dropdown, setDropdown] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [page, setPage] = useState(1)

  return (
    <div className="min-h-screen bg-bg-app">
      {/* ── Navbar ───────────────────────────────────────── */}
      <div className="relative">
        <Navbar
          unreadCount={2}
          onNotificationsClick={() => setNotifOpen((p) => !p)}
          searchSlot={<SearchInput value={search} onChange={setSearch} placeholder="Search showcase…" />}
        />
        {/* Notification panel anchors to navbar right */}
        <div className="absolute right-16 top-0">
          <NotificationPanel
            open={notifOpen}
            onClose={() => setNotifOpen(false)}
            notifications={NOTIFICATIONS}
            onMarkAllRead={() => {}}
            onItemClick={() => setNotifOpen(false)}
          />
        </div>
      </div>

      {/* ── Layout preview ───────────────────────────────── */}
      <div className="flex" style={{ minHeight: 'calc(100vh - 56px)' }}>
        {/* Sidebar demo strip */}
        <Sidebar
          sections={SIDEBAR_SECTIONS}
          userEmail="ali.raza@fixora.edu"
          userRole="Student"
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-10">
          {/* Page header */}
          <div className="mb-10">
            <Text variant="display-md" className="mb-1 text-neutral-900" style={{ fontFamily: 'var(--font-display)' }}>
              UI Showcase
            </Text>
            <Text variant="body-lg" className="text-neutral-500">
              Development preview — all Phase 2 + Phase 3 primitives. No business logic.
            </Text>
          </div>

          <div className="flex flex-col gap-14">

            {/* ── Typography ───────────────────────────────── */}
            <Section title="Typography">
              <Card title="Scale">
                <Text variant="display-lg">Display LG · Syne 700</Text>
                <Text variant="display-md">Display MD · Syne 700</Text>
                <Text variant="h1">Heading 1 · Outfit 600</Text>
                <Text variant="h2">Heading 2 · Outfit 600</Text>
                <Text variant="h3">Heading 3 · Outfit 600</Text>
                <Text variant="h4">Heading 4 · Outfit 600</Text>
                <Text variant="body-lg">Body LG · Manrope 400</Text>
                <Text variant="body-md">Body MD · Manrope 400 — default UI text</Text>
                <Text variant="body-sm">Body SM · Manrope 400 — meta</Text>
                <Text variant="caption">Caption · Manrope 500 — labels</Text>
                <span className="text-mono-md">Mono MD · IBM Plex Mono 500 — FIX-0042</span>
                <span className="text-mono-sm text-neutral-500">Mono SM · IBM Plex Mono 400 — 09:42 AM</span>
              </Card>
            </Section>

            {/* ── Color tokens ─────────────────────────────── */}
            <Section title="Color Tokens">
              <Card title="Brand">
                {[
                  ['brand-primary', '#0B4F5C'],
                  ['brand-primary-hover', '#093F4A'],
                  ['brand-primary-subtle', '#E6F2F4'],
                  ['brand-primary-muted', '#7AA3AC'],
                ].map(([name, hex]) => (
                  <div key={name} className="flex items-center gap-3">
                    <div
                      className="h-7 w-7 rounded-md border border-border-default"
                      style={{ background: `var(--color-${name})` }}
                    />
                    <Text variant="body-sm" className="text-neutral-600">{name}</Text>
                    <span className="text-mono-sm text-neutral-400">{hex}</span>
                  </div>
                ))}
              </Card>
              <Card title="Action / Semantic">
                {[
                  ['action-default', '#E8A317'],
                  ['success-default', '#2F7D4A'],
                  ['warning-default', '#C45C26'],
                  ['danger-default', '#B42318'],
                  ['info-default', '#2F6FED'],
                ].map(([name, hex]) => (
                  <div key={name} className="flex items-center gap-3">
                    <div
                      className="h-7 w-7 rounded-md border border-border-default"
                      style={{ background: `var(--color-${name})` }}
                    />
                    <Text variant="body-sm" className="text-neutral-600">{name}</Text>
                    <span className="text-mono-sm text-neutral-400">{hex}</span>
                  </div>
                ))}
              </Card>
            </Section>

            {/* ── Buttons ──────────────────────────────────── */}
            <Section title="Buttons">
              <Card title="Variants">
                <Button variant="primary">Primary CTA</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="tertiary">Tertiary / Ghost</Button>
                <Button variant="brand">Brand</Button>
                <Button variant="danger">Danger</Button>
              </Card>
              <Card title="Sizes">
                <Button size="sm">Small</Button>
                <Button size="md">Medium (default)</Button>
                <Button size="lg">Large</Button>
              </Card>
              <Card title="States">
                <Button loading>Loading…</Button>
                <Button disabled>Disabled</Button>
                <Button variant="secondary" loading>Loading secondary</Button>
              </Card>
              <Card title="With Icons">
                <Button variant="primary">
                  <Icon icon={CircleCheck} size="sm" />
                  Resolve
                </Button>
                <Button variant="secondary">
                  <Icon icon={Forward} size="sm" />
                  Forward
                </Button>
                <Button variant="tertiary">
                  <Icon icon={RotateCcw} size="sm" />
                  Reopen
                </Button>
              </Card>
            </Section>

            {/* ── Form Inputs ──────────────────────────────── */}
            <Section title="Form Inputs">
              <Card title="Input variants">
                <Input label="Email address" placeholder="ali.raza@uni.edu" />
                <Input label="With helper" placeholder="Room number" helperText="Enter your hostel room number" />
                <Input label="Error state" placeholder="…" error="This field is required." value="" onChange={() => {}} />
                <Input label="Disabled" placeholder="Not editable" disabled />
              </Card>
              <Card title="Textarea">
                <Textarea label="Complaint description" placeholder="Describe your issue in detail…" rows={4} />
                <Textarea label="Error" error="Description is too short." value="ok" onChange={() => {}} />
              </Card>
              <Card title="Search">
                <SearchInput value={search} onChange={setSearch} placeholder="Search complaints…" />
                {search && <Text variant="body-sm" className="text-neutral-500">Query: {search}</Text>}
              </Card>
              <Card title="Dropdown">
                <Dropdown
                  label="Category"
                  placeholder="Select category…"
                  options={[
                    { value: 'plumbing', label: 'Plumbing' },
                    { value: 'electrical', label: 'Electrical' },
                    { value: 'carpentry', label: 'Carpentry' },
                    { value: 'hvac', label: 'HVAC', disabled: true },
                  ]}
                  value={dropdown}
                  onChange={setDropdown}
                />
              </Card>
            </Section>

            {/* ── Chips & Badges ───────────────────────────── */}
            <Section title="Status Chips & Badges">
              <Card title="Status Chips">
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => <StatusChip key={s} status={s} />)}
                </div>
              </Card>
              <Card title="Badges">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Icon icon={Bell} size="md" className="text-neutral-600" />
                    <Badge variant="danger" count={3} />
                  </div>
                  <Badge variant="brand" count={12} />
                  <Badge variant="danger">99+</Badge>
                </div>
              </Card>
            </Section>

            {/* ── Alerts ───────────────────────────────────── */}
            <Section title="Alerts">
              <div className="flex w-full flex-col gap-3">
                <Alert variant="info" title="Informational" description="Your complaint has been received and is under review." />
                <Alert variant="success" title="Success" description="Complaint #FIX-0042 has been resolved by maintenance." />
                <Alert variant="warning" title="High Priority" description="This issue is marked high priority and will be addressed within 24 hours." />
                {!alertDismissed && (
                  <Alert
                    variant="danger"
                    title="Error"
                    description="Could not submit complaint. Please try again."
                    onDismiss={() => setAlertDismissed(true)}
                  />
                )}
              </div>
            </Section>

            {/* ── Skeletons ────────────────────────────────── */}
            <Section title="Skeletons">
              <Card title="Loading states">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-full rounded-md" />
                <div className="flex gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </Card>
            </Section>

            {/* ── Glass Surface ────────────────────────────── */}
            <Section title="Glass Surface">
              <Card title="Dropdown elevation">
                <GlassSurface elevation="dropdown" className="rounded-xl p-4">
                  <Text variant="body-md">Dropdown glass — blur 16px, saturate 1.2</Text>
                </GlassSurface>
              </Card>
              <Card title="Modal elevation">
                <GlassSurface elevation="modal" className="rounded-xl p-4">
                  <Text variant="body-md">Modal glass — deeper shadow</Text>
                </GlassSurface>
              </Card>
            </Section>

            {/* ── Dialog ───────────────────────────────────── */}
            <Section title="Dialog">
              <Card title="Trigger">
                <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                  Open Dialog
                </Button>
                <Dialog
                  open={dialogOpen}
                  onClose={() => setDialogOpen(false)}
                  title="Forward Complaint"
                  description="Are you sure you want to forward this complaint to the Maintenance Office? This action cannot be undone."
                  footer={
                    <>
                      <Button variant="tertiary" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" onClick={() => setDialogOpen(false)}>
                        <Icon icon={Forward} size="sm" />
                        Forward
                      </Button>
                    </>
                  }
                />
              </Card>
            </Section>

            {/* ── Table + Pagination ───────────────────────── */}
            <Section title="Table & Pagination">
              <div className="w-full">
                <Table>
                  <TableHead>
                    <TableRow hoverable={false}>
                      <TableTh>Ticket ID</TableTh>
                      <TableTh>Title</TableTh>
                      <TableTh>Status</TableTh>
                      <TableTh>Department</TableTh>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {TABLE_ROWS.map((row) => (
                      <TableRow key={row.id}>
                        <TableTd mono>{row.id}</TableTd>
                        <TableTd>{row.title}</TableTd>
                        <TableTd>
                          <StatusChip status={row.status} />
                        </TableTd>
                        <TableTd className="text-neutral-600">{row.dept}</TableTd>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="border-x border-b border-border-default rounded-b-md bg-bg-surface">
                  <Pagination
                    page={page}
                    pageSize={4}
                    total={TABLE_ROWS.length}
                    onPageChange={setPage}
                  />
                </div>
              </div>
            </Section>

            {/* ── Timeline ─────────────────────────────────── */}
            <Section title="Timeline">
              <Card title="Audit trail">
                <Timeline items={TIMELINE_ITEMS} />
              </Card>
            </Section>

            {/* ── AI Recommendation Card ───────────────────── */}
            <Section title="AI Recommendation Card">
              <div className="max-w-sm w-full">
                <AIRecommendationCard
                  fields={[
                    { label: 'Category', value: 'Plumbing' },
                    { label: 'Priority', value: 'High' },
                    { label: 'Department', value: 'Maintenance Office' },
                  ]}
                />
              </div>
            </Section>

          </div>

          {/* Bottom padding */}
          <div className="h-20" />
        </main>
      </div>
    </div>
  )
}
