# Frontend

## Pages

| Page | Route | Key states |
|------|-------|------------|
| LoginPage | `/` | idle, loading, error |
| SignupPage | `/signup` | form, success+redirect |
| DashboardPage | `/dashboard` | loading, empty(CTA), populated(cards grid) |
| MemberPage | `/member/:memberId` | member header, FocusInput, timeline, ScanButton |
| HistoryPage | `/history` | initial(pick member+date), empty, populated |

## Components

| Component | Purpose |
|-----------|---------|
| Navbar | Sticky pill nav, glass-strong, Dashboard+History links, admin email, logout |
| MemberCard | Accent bar (mint=FREE, magenta=RESTRICTED), progress, Gmail status, actions |
| TimelineSlot | Single slot — 4 states: done/missed/current/future (see below) |
| SpanBlock | Merged consecutive identical slot entries |
| BreakSlot | Break entry with editable note |
| SlotEditor | Textarea + span selector for logging |
| ScanButton | RESTRICTED only — idle/scanning/results/needs-auth states |
| FocusInput | Quick focus/status input at top of MemberPage |
| MemberHistory | Recent history display |
| QuickActions | Chip shortcuts for common log entries |

## TimelineSlot states
- `done` — green border, check icon, text, "Logged" badge
- `missed` — rose border, X icon, "No entry", "Missed" badge
- `current` — mint ring, pulsing dot, textarea + Send, "Now" badge
- `future` — dimmed, circle icon, "Upcoming" badge

Current slot = dynamic based on `startedAt` — NOT `Math.max(1, Math.min(10, currentHour - 7))`

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
