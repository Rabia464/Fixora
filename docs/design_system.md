# Fixora Design System

**Version:** 1.0  
**Status:** Approved — single source of truth for all frontend work  
**Brand foundation:** Campus Signal (Fixora Brand Identity & Visual Guidelines)  
**Inspirations:** Duolingo’s friendly spacing & approachable interactions · Apple Liquid Glass used *sparingly* for elevated surfaces only  

> **Rule:** No React pages or application screens are defined here. This document specifies tokens, components, and rules only. Every future UI decision must comply.

---

## 0. Design Intent

Fixora must feel **calm, modern, friendly, clean, professional, and trustworthy**.

It must **not** look like a generic AI-generated admin dashboard.

| Do | Don’t |
|----|--------|
| Quiet canvases, clear status, generous whitespace | Purple–indigo AI gradients |
| Soft elevation on *elevated* surfaces only | Heavy glassmorphism / glowing cards |
| Friendly micro-interactions that confirm state | Bounce, confetti, decorative motion |
| Role-honest density (student / supervisor / maintenance) | One cluttered “dashboard for everyone” |
| Outline icons, semantic color + label | Color-only status, emoji as UI |

**Liquid Glass policy:** Allowed only on navigation bars, floating menus, dialogs, dropdowns, and other *elevated interactive* surfaces. Main content stays opaque, structured, and highly readable.

---

## 1. Color System

### 1.1 Brand & primary

| Token | Hex | Role | Why it exists |
|-------|-----|------|----------------|
| `color.brand.primary` | `#0B4F5C` | Brand identity, nav active, links (secondary) | Teal-ink signals competence and campus infrastructure — not “AI purple.” |
| `color.brand.primary-hover` | `#093F4A` | Hover on brand surfaces | Darker for pressed feedback without neon. |
| `color.brand.primary-subtle` | `#E6F2F4` | Soft brand backgrounds (selected row, chip rest) | Calm selection state. |
| `color.brand.primary-muted` | `#7AA3AC` | Decorative / disabled brand tint | Softens brand when inactive. |

### 1.2 Secondary / action (CTA)

| Token | Hex | Role | Why it exists |
|-------|-----|------|----------------|
| `color.action.default` | `#E8A317` | Primary buttons, key “next step” | Signal amber = do this now, without alarm. |
| `color.action.hover` | `#D4920F` | Primary button hover | Clear affordance. |
| `color.action.pressed` | `#B87A0A` | Primary button pressed | Confirms input. |
| `color.action.subtle` | `#FFF6E0` | Soft highlight behind CTAs / tips | Friendly warmth without cream–terracotta kits. |
| `color.action.foreground` | `#152028` | Text/icons on amber | Ensures WCAG contrast on CTA. |

### 1.3 Semantic

| Token | Hex | Role | Why it exists |
|-------|-----|------|----------------|
| `color.success.default` | `#2F7D4A` | Resolved, confirmed, success toast | Closure and trust. |
| `color.success.subtle` | `#E8F5EC` | Success banners / chips | Calm positive surface. |
| `color.warning.default` | `#C45C26` | High priority, caution | Urgency without panic red. |
| `color.warning.subtle` | `#FCEEE6` | Warning chips / callouts | Soft urgency. |
| `color.danger.default` | `#B42318` | Errors, destructive, blocked | Rare; true blockers only. |
| `color.danger.subtle` | `#FDECEC` | Error fields / alerts | Readable error context. |
| `color.info.default` | `#2F6FED` | AI suggestions, informational | Guidance blue — assistive, not brand. |
| `color.info.subtle` | `#EAF1FE` | AI recommendation card background | Separates AI from brand teal. |

**Status mapping (complaints):**

| Status | Chip bg | Chip fg | Border |
|--------|---------|---------|--------|
| Open / UnderReview | `primary-subtle` | `brand.primary` | `brand.primary` @ 20% |
| Forwarded | `info.subtle` | `info.default` | `info.default` @ 20% |
| InProgress | `action.subtle` | `#8A5A00` | `action.default` @ 30% |
| Resolved | `success.subtle` | `success.default` | `success.default` @ 20% |
| Closed | `neutral.100` | `neutral.700` | `border.default` |
| Reopened | `warning.subtle` | `warning.default` | `warning.default` @ 20% |

### 1.4 Neutrals

| Token | Hex | Why |
|-------|-----|-----|
| `color.neutral.0` | `#FFFFFF` | Pure white for elevated opaque panels |
| `color.neutral.50` | `#F7F9FA` | Softest wash |
| `color.neutral.100` | `#F3F5F7` | Default app canvas (stone mist) |
| `color.neutral.200` | `#E8EEF0` | Secondary canvas / zebra rows |
| `color.neutral.300` | `#D5DEE3` | Borders, dividers |
| `color.neutral.400` | `#A8B5BE` | Disabled icons, placeholders |
| `color.neutral.500` | `#7A8A95` | Tertiary text |
| `color.neutral.600` | `#5C6B76` | Secondary text, meta |
| `color.neutral.700` | `#3D4A54` | Strong secondary |
| `color.neutral.800` | `#152028` | Primary ink |
| `color.neutral.900` | `#0B1218` | Maximum contrast (rare) |

### 1.5 Backgrounds & surfaces

| Token | Value | Why |
|-------|-------|-----|
| `color.bg.app` | `neutral.100` | Calm workspace; not flat pure white. |
| `color.bg.subtle` | Linear `neutral.100` → `neutral.200` (vertical, low contrast) | Quiet atmosphere on auth / empty shells. |
| `color.bg.surface` | `neutral.0` | Opaque content panels, tables, forms. |
| `color.bg.surface-raised` | `neutral.0` @ 86% + blur (glass *only* on elevated chrome) | Liquid Glass for nav / menus / dialogs. |
| `color.bg.overlay` | `#152028` @ 40% | Modal scrim; keeps focus. |
| `color.bg.input` | `neutral.0` | Clear fields on mist canvas. |
| `color.bg.input-disabled` | `neutral.200` | Disabled affordance. |

**Glass recipe (elevated only):**

```
background: rgba(255, 255, 255, 0.72)
backdrop-filter: blur(16px) saturate(1.2)
border: 1px solid rgba(213, 222, 227, 0.65)
```

Do **not** apply glass to ticket lists, forms, analytics content, or full-page backgrounds.

### 1.6 Borders, hover, focus, disabled

| Token | Value | Why |
|-------|-------|-----|
| `color.border.default` | `neutral.300` | Structure without noise. |
| `color.border.strong` | `neutral.400` | Emphasized containers. |
| `color.border.focus` | `brand.primary` | Keyboard focus ring core. |
| `color.border.danger` | `danger.default` | Invalid fields. |
| `color.hover.surface` | `neutral.50` | Row / list hover. |
| `color.hover.brand` | `brand.primary-hover` | Brand control hover. |
| `color.focus.ring` | `0 0 0 3px rgba(11, 79, 92, 0.28)` | Accessible focus halo. |
| `color.disabled.fg` | `neutral.400` | Disabled text/icons. |
| `color.disabled.bg` | `neutral.200` | Disabled fills. |
| `color.disabled.border` | `neutral.300` | Disabled outlines. |

---

## 2. Typography

### 2.1 Font families (Google Fonts)

| Role | Family | Fallback | Why |
|------|--------|----------|-----|
| **Display** | [Syne](https://fonts.google.com/specimen/Syne) | `system-ui, sans-serif` | Distinct brand presence on login / empty heroes. |
| **Heading** | [Outfit](https://fonts.google.com/specimen/Outfit) | `system-ui, sans-serif` | Modern, friendly, professional headings. |
| **Body** | [Manrope](https://fonts.google.com/specimen/Manrope) | `system-ui, sans-serif` | Highly legible for forms, queues, long scan. |
| **Mono** | [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) | `ui-monospace, monospace` | Ticket IDs, timestamps, audit lines. |

**Import (reference):**

```
Syne: 600,700,800
Outfit: 500,600,700
Manrope: 400,500,600,700
IBM Plex Mono: 400,500
```

### 2.2 Type scale

| Token | Size | Line height | Weight | Font | Use |
|-------|------|-------------|--------|------|-----|
| `text.display.lg` | 40px / 2.5rem | 1.15 | 700 | Syne | Login brand lockup only |
| `text.display.md` | 32px / 2rem | 1.2 | 700 | Syne | Rare empty-state titles |
| `text.h1` | 28px / 1.75rem | 1.25 | 600 | Outfit | Page titles |
| `text.h2` | 22px / 1.375rem | 1.3 | 600 | Outfit | Section titles |
| `text.h3` | 18px / 1.125rem | 1.35 | 600 | Outfit | Card / panel titles |
| `text.h4` | 16px / 1rem | 1.4 | 600 | Outfit | Subsection / dense headers |
| `text.body.lg` | 16px / 1rem | 1.55 | 400 | Manrope | Comfortable body |
| `text.body.md` | 14px / 0.875rem | 1.5 | 400 | Manrope | Default UI body / table cells |
| `text.body.sm` | 13px / 0.8125rem | 1.45 | 400 | Manrope | Meta, helper |
| `text.caption` | 12px / 0.75rem | 1.4 | 500 | Manrope | Labels, chips, timestamps |
| `text.mono.md` | 13px / 0.8125rem | 1.4 | 500 | IBM Plex Mono | Ticket IDs |
| `text.mono.sm` | 12px / 0.75rem | 1.4 | 400 | IBM Plex Mono | Audit timestamps |

### 2.3 Hierarchy rules

1. **One display face per branded surface** — never stack Syne headlines in ops screens.
2. **Outfit for structure, Manrope for reading** — headings organize; body explains.
3. **Mono for evidence** — IDs and audit never use display fonts.
4. **Brand > headline on login** — Fixora wordmark outranks any supporting sentence.
5. **Max line length** ~65–75ch for descriptions; tables unconstrained within grid.

---

## 3. Spacing System (8-point)

Base unit: **4px** for fine control; preferred steps are multiples of **8**.

| Token | Value | Typical use |
|-------|-------|-------------|
| `space.0` | 0 | Reset |
| `space.1` | 4px | Icon gaps, dense chip padding-y |
| `space.2` | 8px | Compact padding, inline gaps |
| `space.3` | 12px | Input padding-y companion, tight stacks |
| `space.4` | 16px | Default component padding, form gaps |
| `space.5` | 20px | Comfortable control padding |
| `space.6` | 24px | Card padding, section inner |
| `space.8` | 32px | Between form groups |
| `space.10` | 40px | Section spacing (compact) |
| `space.12` | 48px | Section spacing (default) |
| `space.16` | 64px | Major layout blocks |
| `space.20` | 80px | Page top breathing (auth) |
| `space.24` | 96px | Hero / empty-state vertical |

**Layout rules**

| Context | Spec |
|---------|------|
| Page horizontal padding (desktop) | `space.8`–`space.12` |
| Page horizontal padding (mobile) | `space.4` |
| Stack between related fields | `space.4` |
| Stack between form sections | `space.8` |
| Between page sections | `space.12` |
| Sidebar item padding | `space.3` y / `space.4` x |
| Navbar height | 56px (content) + safe glass padding |
| Content max width (ops) | 1200px |
| Content max width (readable form) | 640px |

**Duolingo-inspired whitespace:** Prefer *one clear primary action* and empty space over packing secondary tools into the first viewport.

---

## 4. Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `radius.none` | 0 | Tables (outer optional), data grids |
| `radius.sm` | 6px | Badges, small chips, compact controls |
| `radius.md` | 8px | **Buttons**, inputs, textareas, search |
| `radius.lg` | 12px | Cards (when used), AI recommendation card |
| `radius.xl` | 16px | Dialogs, sheets |
| `radius.2xl` | 20px | Floating menus / large glass panels |
| `radius.full` | 9999px | Avatars only — **not** default buttons |

**Rules:** Soft but not pill-everything. Buttons and inputs share `radius.md` for familiarity. Dialogs get more roundness to feel approachable.

---

## 5. Shadows & Elevation

Soft shadows only. No heavy floating-card stacks on content.

| Level | Token | Shadow | Use |
|-------|-------|--------|-----|
| 0 | `elevation.0` | none | Flat content on canvas |
| 1 | `elevation.surface` | `0 1px 2px rgba(21, 32, 40, 0.04)` | Optional hairline lift on opaque panels |
| 2 | `elevation.hover` | `0 2px 8px rgba(21, 32, 40, 0.06)` | Interactive row / button lift (subtle) |
| 3 | `elevation.dropdown` | `0 8px 24px rgba(21, 32, 40, 0.10)` | Dropdowns, popovers (+ glass) |
| 4 | `elevation.nav` | `0 1px 0 rgba(213,222,227,0.8), 0 4px 16px rgba(21,32,40,0.05)` | Top nav / sidebar edge |
| 5 | `elevation.modal` | `0 16px 48px rgba(21, 32, 40, 0.16)` | Dialogs |

**Glass surfaces** combine `elevation.dropdown` or `elevation.modal` with the glass recipe — depth from blur + soft shadow, not glow.

---

## 6. Motion System

Motion communicates **system state**, not decoration.

### 6.1 Durations

| Token | ms | Use |
|-------|-----|-----|
| `motion.instant` | 0 | Reduced-motion fallback |
| `motion.fast` | 120 | Hover color, focus ring |
| `motion.normal` | 200 | Button press, chip change, menu open |
| `motion.moderate` | 280 | Dialog / panel enter |
| `motion.slow` | 400 | Page section stagger (max) |

### 6.2 Easing

| Token | Curve | Use |
|-------|-------|-----|
| `ease.standard` | `cubic-bezier(0.2, 0.0, 0, 1)` | Most UI |
| `ease.emphasized` | `cubic-bezier(0.2, 0.0, 0, 1.0)` | Dialog enter |
| `ease.exit` | `cubic-bezier(0.4, 0, 1, 1)` | Dismiss |
| `ease.linear` | `linear` | Progress bars only |

### 6.3 Interaction patterns

| Interaction | Spec |
|-------------|------|
| Hover (buttons) | Background + 1px translateY(0); optional `elevation.hover` — no scale > 1.02 |
| Hover (rows) | `color.hover.surface` @ `motion.fast` |
| Focus | Focus ring fades in `motion.fast` |
| Menu open | Fade + 4px rise, `motion.normal` |
| Dialog open | Fade scrim + scale 0.98→1, `motion.moderate` |
| Status change | Chip color crossfade `motion.normal` |
| Toast enter | Slide from top 8px + fade |
| Loading | Skeleton shimmer 1.2s linear infinite |
| Submit success | Brief 200ms highlight on ticket ID / status |

### 6.4 Reduced motion

```
@media (prefers-reduced-motion: reduce) {
  → durations → motion.instant (or ≤ 50ms)
  → no transform travel; opacity-only allowed if needed
  → skeletons become static pulse or solid placeholder
}
```

---

## 7. Icons

**Library:** [Lucide](https://lucide.dev) (outline, consistent, MIT)

| Token | Size | Stroke |
|-------|------|--------|
| `icon.xs` | 14px | 1.75 |
| `icon.sm` | 16px | 1.75 |
| `icon.md` | 20px | 1.75 |
| `icon.lg` | 24px | 1.75 |
| `icon.xl` | 32px | 1.5 (empty states only) |

**Usage rules**

1. Default UI icons: `icon.md` / stroke **1.75**.
2. Match stroke across a toolbar; never mix filled + outline in one cluster.
3. Pair status icons with text labels in dense ops views.
4. Icon-only controls require `aria-label` and ≥ 44×44px hit target.
5. Preferred metaphors: `clipboard-list`, `wrench`, `bell`, `forward`, `circle-check`, `rotate-ccw`, `sparkles` (AI only).

---

## 8. Component Specifications

Shared rules for all components:

- Min touch target: **44×44px**
- Focus visible: `color.focus.ring` + `border.focus`
- Disabled: `disabled.*` tokens; no hover elevation
- Cards are **optional** — prefer open layout unless the unit is interactive

---

### 8.1 Buttons

| Variant | Bg | Fg | Border | When |
|---------|----|----|--------|------|
| **Primary** | `action.default` | `action.foreground` | none | Main next action (1 per view) |
| **Secondary** | transparent | `brand.primary` | `brand.primary` | Secondary actions |
| **Tertiary / Ghost** | transparent | `neutral.800` | none | Low emphasis |
| **Danger** | `danger.default` | white | none | Destructive confirm |
| **Brand** | `brand.primary` | white | none | Nav / brand-emphasis (rare vs amber CTA) |

| Size | Height | Pad X | Type |
|------|--------|-------|------|
| sm | 32px | 12px | `body.sm` medium |
| md | 40px | 16px | `body.md` medium |
| lg | 48px | 20px | `body.lg` semibold |

Radius: `radius.md`. Icons: `icon.sm` with 8px gap. Loading: replace label with spinner, keep width.

**Interaction:** hover → variant hover color; active → pressed; focus → ring; disabled → muted.

---

### 8.2 Inputs

| Property | Spec |
|----------|------|
| Height | 40px (md) |
| Padding | 10px 12px |
| Radius | `radius.md` |
| Border | `border.default` → focus `border.focus` |
| Bg | `bg.input` |
| Label | `caption` / semibold above, 6px gap |
| Helper | `body.sm` / `neutral.600` |
| Error | border `danger` + helper in `danger.default` |
| Placeholder | `neutral.400` |

---

### 8.3 Text Areas

Same tokens as inputs. Min-height 96px. Resize vertical only. Used for complaint description / reopen reason.

---

### 8.4 Dropdowns

Elevated surface: **glass recipe** + `elevation.dropdown` + `radius.lg`.  
Item height 36–40px; hover `hover.surface`; selected `brand.primary-subtle`.  
Keyboard: ↑↓, Enter, Esc. Max height 280px + scroll.

---

### 8.5 Search Bar

Input variant with leading `search` icon (`icon.sm`, `neutral.500`).  
Height 40px; full width in list toolbars. Clear (×) appears when non-empty.  
Debounce guidance: 200–300ms for client filter; Enter to submit server search.

---

### 8.6 Cards

**Default: avoid cards.** When needed (interactive ticket summary, AI block):

| Property | Spec |
|----------|------|
| Bg | `bg.surface` (opaque) |
| Radius | `radius.lg` |
| Padding | `space.6` |
| Border | 1px `border.default` |
| Shadow | `elevation.0` or `elevation.surface` — not glass |
| Hover | border → `border.strong` or bg `hover.surface` if clickable |

---

### 8.7 Status Chips

Height 24px; pad 0 10px; radius `radius.sm`; type `caption`.  
Always: **color + label** (+ optional Lucide status icon).  
See semantic status mapping in §1.3.

---

### 8.8 Badges

Smaller than chips (20px height). Used for counts on nav (notifications).  
Bg `danger.default` or `brand.primary`; fg white; `radius.full`; min-width 20px; tabular numbers.

---

### 8.9 Alerts

Inline, opaque. Variants: info / success / warning / danger.  
Left accent bar 3px in semantic color; bg `*.subtle`; padding `space.4`; radius `radius.md`.  
Optional dismiss. Not glass.

---

### 8.10 Toasts

Floating, top-center or top-right. Glass **allowed** (elevated).  
Width 320–400px; auto-dismiss 4–6s (errors sticky until dismiss).  
Enter: fade + 8px slide (`motion.normal`).

---

### 8.11 Dialogs

Glass **allowed**. Scrim `bg.overlay`. Panel max-width 480px (confirm) / 640px (forms).  
Radius `radius.xl`; padding `space.6`; `elevation.modal`.  
Title `h3`; body `body.md`; actions right-aligned: Ghost cancel + Primary confirm.  
Focus trap + Esc to close (unless destructive critical).

---

### 8.12 Tables

Opaque. Header `neutral.50`, `caption` semibold, `neutral.600`.  
Row height 48–56px; cell `body.md`; hairline `border.default`.  
Hover row `hover.surface`. Ticket ID column: `text.mono.md` + brand link color.  
No zebra required; optional `neutral.50` alternate for dense maintenance queues.  
Mobile: convert to stacked definition list / card rows (see responsive).

---

### 8.13 Pagination

Previous / Next ghost buttons + page indicator (`body.sm`).  
Prefer “Load more” on mobile queues. Show total when known: `1–20 of 86`.

---

### 8.14 Sidebar

Desktop navigation. Width 240px collapsed icon-rail 72px.  
**Glass optional** on sidebar shell; items opaque hover.  
Active item: `brand.primary-subtle` + `brand.primary` text/icon.  
Sections: role-specific (Student / Supervisor / Maintenance).  
Bottom: user email truncated + role caption.

---

### 8.15 Navbar

Height 56–64px. **Glass recommended.**  
Left: Fixora wordmark (Syne or logo mark) — brand-first.  
Center/right: search (optional), notifications, avatar menu.  
Border-bottom hairline + `elevation.nav`. Sticky top.

---

### 8.16 Notification Panel

Dropdown/drawer from bell — **glass**. Width 360px.  
List unread first; row: title `body.md` medium, time `mono.sm` muted.  
Footer action: “Mark all as read” (maps to API). Empty: illustration + calm copy.

---

### 8.17 Timeline (audit)

Vertical line `border.default`; dots semantic by action.  
Timestamp mono; actor + action Manrope. Dense but readable (`space.4` between events).  
Used on complaint detail — evidence, not decoration.

---

### 8.18 Empty States

Centered. Optional sparse line illustration (infrastructure style).  
Title: `display.md` or `h2` (Syne only if brand-adjacent).  
Body: one short sentence. One Primary CTA. Generous `space.16` vertical.

---

### 8.19 Error States

Inline alert or full-panel: clear cause + recovery action (“Try again” / “Back to list”).  
Never blame the user. Preserve form input on validation errors.

---

### 8.20 Loading Skeletons

Shape matches real content (row, form, detail header).  
Shimmer: `neutral.200` → `neutral.100` → `neutral.200`.  
Radius matches target component. No full-page-only spinner.

---

### 8.21 AI Recommendation Card

**Purpose:** Show AI category / priority / department as *suggestions*, clearly overridable.

| Property | Spec |
|----------|------|
| Bg | `info.subtle` |
| Border | 1px `info.default` @ 25% |
| Radius | `radius.lg` |
| Icon | `sparkles` in `info.default` |
| Title | “AI suggestion” — `caption` / info color |
| Fields | Label + value; editable by supervisor |
| Helper | “You can override before forwarding.” |
| Not glass | Opaque; assistive, not magical |

Never style AI with brand purple or animated glow.

---

## 9. Responsive System

| Name | Breakpoint | Token |
|------|------------|-------|
| Mobile | 0–639px | `bp.mobile` |
| Tablet | 640–1023px | `bp.tablet` |
| Laptop | 1024–1279px | `bp.laptop` |
| Desktop | ≥ 1280px | `bp.desktop` |

### Layout adaptation

| Zone | Mobile | Tablet | Laptop+ |
|------|--------|--------|---------|
| Nav | Top bar + bottom or hamburger sheet | Top + collapsible side | Persistent sidebar + top nav |
| Ticket lists | Stacked rows / compact cards | Table-lite | Full table |
| Forms | Single column, full width | Single column max 640 | Same, centered in content |
| Dialogs | Full-width sheet (bottom) | Centered modal | Centered modal |
| Notification | Full-screen sheet | Panel | Panel |
| Spacing | Tighter (`space.4` page pad) | Medium | Comfortable (`space.8+`) |

**Touch:** All primary actions ≥ 44px. Prefer thumb-zone primary CTA on mobile ticket detail.

---

## 10. Accessibility (WCAG)

Target: **WCAG 2.2 AA**

| Area | Rule |
|------|------|
| **Contrast** | Body text ≥ 4.5:1 on canvas; large text / chips ≥ 3:1; UI borders visible |
| **Focus** | Visible focus ring on all interactive elements; never `outline: none` without replacement |
| **Keyboard** | Tab order logical; menus/dialogs Esc; tables not keyboard traps |
| **Touch** | Min 44×44px targets; 8px gap between adjacent targets |
| **Status** | Color + text (+ icon); never color alone |
| **Forms** | Labels always visible (not placeholder-only); errors linked via `aria-describedby` |
| **Live regions** | Toasts / status updates announced politely |
| **Motion** | Honor `prefers-reduced-motion` |
| **Glass** | Text on glass must still meet contrast; if blur fails, fall back to opaque `neutral.0` |

---

## 11. Design Tokens (summary export)

Use these names when implementing CSS variables / theme later:

```
color.brand.* | color.action.* | color.success.* | color.warning.*
color.danger.* | color.info.* | color.neutral.*
color.bg.* | color.border.* | color.hover.* | color.focus.* | color.disabled.*

font.display | font.heading | font.body | font.mono
text.display.* | text.h1–h4 | text.body.* | text.caption | text.mono.*

space.0–24
radius.sm–2xl | radius.full
elevation.0–modal
motion.* | ease.*
icon.xs–xl
bp.mobile | bp.tablet | bp.laptop | bp.desktop
```

---

## 12. UI Rules (non-negotiable)

1. **Campus Signal palette only** — teal identity, amber CTA, cool mist canvas.
2. **Liquid Glass sparingly** — nav, menus, dialogs, dropdowns, toasts only.
3. **Main content stays opaque and readable.**
4. **One primary amber CTA per view.**
5. **Status is the hero** on ticket surfaces.
6. **Cards are rare**; open layout is default.
7. **AI is blue-assistive**, always overridable, never theatrical.
8. **Type triad:** Syne (rare) · Outfit · Manrope · IBM Plex Mono.
9. **Lucide outline 1.75** — consistent metaphors.
10. **Motion proves the system heard you** — short, state-linked, reduced-motion safe.
11. **No** purple AI kits, cream–terracotta editorial, broadsheet admin, dark-default, glow stacks, emoji UI.
12. **Brand test on entry:** remove the nav — still obviously Fixora.

---

## 13. Interaction Guidelines

| Pattern | Guideline |
|---------|-----------|
| Submit complaint | Primary CTA; disable double-submit; then show ticket ID prominently |
| Supervisor override | Edit AI fields in place; confirm change visibly; audit follows |
| Forward / progress / resolve | Confirm only when irreversible; otherwise one-click with toast |
| Notifications | Unread emphasis; mark-all in panel footer |
| Empty queue | Friendly empty state + single next action |
| Errors | Inline first; toast for async failures |
| Hover | Subtle; never rely on hover-only for essential actions (touch) |

---

## 14. Component inventory checklist

Before any screen build, implement or theme these primitives first:

- [ ] Button (all variants/sizes)
- [ ] Input / Textarea / Search
- [ ] Dropdown / Select
- [ ] Status Chip / Badge
- [ ] Alert / Toast
- [ ] Dialog
- [ ] Table + Pagination
- [ ] Sidebar + Navbar (glass)
- [ ] Notification Panel (glass)
- [ ] Timeline
- [ ] Empty / Error / Skeleton
- [ ] AI Recommendation Card

---

## 15. Document control

| Field | Value |
|-------|-------|
| Source of truth | `docs/design_system.md` |
| Brand parent | Fixora Brand Identity (Campus Signal) |
| Next step (when approved) | Implement tokens + primitives in frontend — still no product pages until primitives exist |
| Owners | Product Design + Frontend |

**End of Fixora Design System v1.0**
