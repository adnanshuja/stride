# Frontend

## Pages

| Page | Route | Key states |
|------|-------|------------|
| LoginPage | `/` | idle, loading, error |
| SignupPage | `/signup` | form, success+redirect |
| DashboardPage | `/dashboard` | loading(skeleton), empty(CTA), populated(stats+pipeline+bars+grid) |
| MemberPage | `/member/:memberId` | member header, FocusInput, log entries with add/edit, ScanButton |
| HistoryPage | `/history` | initial(pick member+date), empty, populated |

## Layout
- All pages: `w-full px-6 lg:px-10` with responsive `max-w` per page
- Dashboard: `max-w-[90rem]` (full width)
- MemberPage: `max-w-4xl`, HistoryPage: `max-w-5xl`
- Navbar: `max-w-[90rem]` sticky pill

## Dashboard-only Components (`dashboard/`)

| Component | Purpose |
|-----------|---------|
| StatsRow | 7-card stats row (Members, Hours, Completion, Gmail, FREE/RESTRICTED, Active, Applications) |
| WeeklyMiniBars | 7-day CSS bar chart (hours) from `/admin/dashboard/weekly` |
| WeeklyJobsBar | 7-day CSS bar chart (job apps) from `/admin/dashboard/jobs` |
| JobsPipeline | Stacked bar funnel (applied→interviewed→offered→rejected) with conversion rates |
| ActivityHighlights | Auto-detected Gmail/LinkedIn feed from todayLog data |
| TeamRing | Inline SVG donut showing team completion % |

## Shared Components

| Component | Purpose |
|-----------|---------|
| Navbar | Sticky pill nav, glass-strong, Dashboard+History links, admin email, logout |
| MemberCard | Accent bar (mint=FREE, magenta=RESTRICTED), progress, Gmail status, actions |
| SlotEditor | Textarea + span selector for logging |
| ScanButton | RESTRICTED only — idle/scanning/results/needs-auth states |
| FocusInput | Quick focus/status input at top of MemberPage |
| MemberHistory | Recent history display |
| QuickActions | Chip shortcuts for common log entries |

## Animation
- `framer-motion` installed for staggered entrance and fade-in animations
- `AnimatedSection.jsx` exports `FadeIn` (single element fade-up) and `Stagger` (staggered children)
- Dashboard sections use FadeIn with incremental delays (0, 0.05, 0.1, 0.15)
- Member cards grid uses Stagger with 0.04s stagger + 0.15s initial delay
- Durations: 250ms, easeOut — follows ui-ux-pro-max guidelines (150-300ms, transform/opacity only)
- `prefers-reduced-motion` respected by framer-motion internally

## UI Components (`client/src/components/ui/`)
All Radix UI primitives, dark theme.

| Component | Variants |
|-----------|---------|
| Button | default(mint), destructive(rose), outline, secondary, ghost, link / sm,default,lg,icon |
| Badge | default(mint), free(blue), restricted(magenta), outline, success, danger |
| Card | rounded-2xl, surface bg, border white/0.06 |
| Input | rounded-xl, dark bg, mint focus ring |
| Select | Radix SelectPrimitive, dark popper dropdown |
| Progress | 1.5px bar, mint or magenta gradient |
| Toast | useToast() hook, variants: default/success/error, auto-dismiss |
| Avatar | circular, gradient fallback |

→ Styling details in `06-ui.md`
