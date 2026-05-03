# Dashboard Overhaul — Design Spec

## Problem
1. Dashboard content is constrained to `max-w-6xl` (~1152px) — empty dark space on wider screens
2. Dashboard shows only 3 stat cards + member grid — no trends, activity feed, or visual insights
3. MemberPage and HistoryPage have the same narrow layout issue

## Solution: Quick Wins (no new packages)

### Layout
- Remove `max-w-6xl mx-auto` from all pages, replace with `w-full px-6 lg:px-10`
- Keep Navbar also full-width: `max-w-6xl` → `max-w-[90rem]`
- Stats grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`
- Member grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4`

### New Dashboard Components

1. **StatsRow** — 6 cards: Members, Hours Filled, Completion %, Gmail Connected, FREE/RESTRICTED, Active Today. All derived from existing dashboard API response.

2. **WeeklyMiniBars** — 7 vertical bars (Mon-Sun) showing total team hours per day. Pure CSS/Tailwind, no chart library. Data from new `/admin/dashboard/weekly` endpoint.

3. **ActivityHighlights** — Last 5 auto-detected entries across all members, extracted from todayLog data already in dashboard response. Shows member name, company, role, source icon.

4. **TeamRing** — Inline SVG donut chart. Stroke-dasharray circle showing completion % (mint) vs remaining (dim). Fits in a small card next to stats.

### Server Changes
- New `GET /api/admin/dashboard/weekly` — aggregates DailyLogs across all admin's members for last 7 days. Returns `{ days: [{ date, totalHours, memberCount }] }`

### Layout Flow (desktop)
```
┌─────────────────────────────────────────────────────┐
│  Navbar (full-width glass pill)                      │
├─────────────────────────────────────────────────────┤
│  Header: "Team Dashboard" + Add Member button        │
├─────────────────────────────────────────────────────┤
│  StatsRow [6 cards] ──────────────── [TeamRing]     │
├─────────────────────────────────────────────────────┤
│  WeeklyMiniBars [7-day bars]                        │
├─────────────────────────────────────────────────────┤
│  ActivityHighlights [compact feed]                  │
├─────────────────────────────────────────────────────┤
│  MemberCard Grid [responsive cols]                  │
└─────────────────────────────────────────────────────┘
```

### States
- Loading: skeleton pulsing cards for stats, bars, and member grid
- Empty (no members): existing empty state centered, unchanged
- Populated: full layout as above
- No activity today: bars show 0, highlights show "No recent activity"
