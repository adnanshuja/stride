# Design System — StrideSync

## Product Context
- **What this is:** Real-time team activity tracking dashboard. Admins monitor member hourly progress, members log activity across 10 daily slots. RESTRICTED members auto-detect job applications via Gmail.
- **Who it's for:** Small teams and their leads. "Built for builders" — developer-adjacent audience that values speed, precision, and no-nonsense UX.
- **Space/industry:** Team productivity / time tracking / workforce analytics.
- **Project type:** Dashboard web application (dark-themed SPA).

## Aesthetic Direction
- **Direction:** Dark Cyber-Minimal — high contrast, glass surfaces, mint as the single signal color. Night-club data center.
- **Decoration level:** Intentional — noise overlay + grid pattern. No decorative orbs, no ambient glows.
- **Mood:** Serious, fast, developer-grade. Every pixel earns its place. The UI communicates "we are monitoring live operations" not "we are tracking tickets."

## Typography
- **Display/Hero:** Sora (600-800 weight) — page titles, section headers, brand typography. Tight letter-spacing, commanding presence.
- **Body:** Inter (400-600 weight) — all body copy, form labels, navigation, buttons. Clean and readable at every size. Default 14px, 12px for dense UIs.
- **UI/Labels:** Inter (same as body).
- **Data/Tables:** JetBrains Mono (400-600 weight) — all metrics, timestamps, status indicators, data tables. Tabular-nums enabled. Precision as a design choice.
- **Code:** JetBrains Mono.
- **Loading:** Google Fonts CDN.
- **Scale:**
  - Display: 48px / 36px / 28px / 22px (Sora, 700-800)
  - Body: 14px / 13px / 12px (Inter, 400-500)
  - Data: 13px / 11px / 10px (JetBrains Mono, 400-500)
  - Labels/badges: 9-11px JetBrains Mono, uppercase, tracking-wider

## Color
- **Approach:** Restrained — mint is the single accent for ALL interactive elements. Magenta reserved strictly for RESTRICTED state. Neutrals do everything else.
- **Primary (mint):** `#51FAAA` — all interactive elements (buttons, links, active states, progress bars, success indicators). Glow: `rgba(81,250,170,0.15)`
- **Restricted (magenta):** `#FF81FF` — RESTRICTED category members, RESTRICTED badges, RESTRICTED progress bars. Glow: `rgba(255,129,255,0.15)`
- **Midnight (bg):** `#0C0E1D` — page background
- **Surface:** `#1A1C2E` — card/input background
- **Surface raised:** `#211F36` — modals, overlays
- **Text primary:** `#f1f5f9`
- **Text muted:** `#94a3b8`
- **Text dim:** `#475569`
- **Border:** `rgba(255,255,255,0.06)` (default), `rgba(255,255,255,0.1)` (strong)
- **Semantic:**
  - Danger: `#FF4D4D`
  - Warning: `#FFB800`
  - Info: `#6C7AFF`
  - Success: `#51FAAA` (same as mint)
- **Dark mode:** Native dark (the default). Light mode: invert bg/surface to whites, adjust mint to `#059669`, adjust magenta to `#db2777`.

## Glass
- Default: `background: rgba(33,31,54,0.65)` `backdrop-filter: blur(24px)` `border: 1px solid rgba(255,255,255,0.06)`
- Strong: `background: rgba(33,31,54,0.88)` `backdrop-filter: blur(32px)` `border: 1px solid rgba(255,255,255,0.08)`

## Spacing
- **Base unit:** 4px
- **Density:** Dense — "3-second status" means more information above the fold. Smaller cards, tighter grids, more visible at once.
- **Scale:**
  - 2xs: 2px
  - xs: 4px
  - sm: 8px
  - md: 12px
  - lg: 16px
  - xl: 24px
  - 2xl: 32px
  - 3xl: 48px

## Layout
- **Approach:** Grid-disciplined — strict columns, predictable alignment.
- **Grid:** auto-fill with `minmax(260px, 1fr)` for member cards. 3-column stats row. Content is full-width under max-width 1200px.
- **Max content width:** 1200px (full-bleed background)
- **Border radius:** Hierarchical — sm(6px) md(10px) lg(16px) xl(20px) full(9999px)

## Motion
- **Approach:** Minimal-functional — micro-interactions on hover/click only. No entrance animations. No page transitions.
- **Easing:** ease-out for enter, ease-in for exit, ease-in-out for moves
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms) long(400-700ms)
- **Scale:** `transform: scale(0.97)` on active/press states. `transform: translateY(-1px)` on card hover.
- **Pulse:** 3s box-shadow pulse for mint (`box-shadow: 0 0 20px rgba(81,250,170,0.3)`) and magenta (`box-shadow: 0 0 20px rgba(255,129,255,0.3)`)

## UI Patterns
- **Buttons:** `rounded-full` mint bg, dark text, `shadow-lg mint/20`. Hover: darker mint, stronger shadow. Active: `scale(0.97)`. Disabled: `opacity-40 pointer-events-none`.
- **Cards:** `rounded-2xl`, glass bg, border `white/0.06`
- **Inputs:** `rounded-xl`, surface bg, mint focus ring (`box-shadow: 0 0 0 3px rgba(81,250,170,0.15)`)
- **Badges:** `rounded-full`, uppercase monospace (9-10px), letter-spacing, category-colored (mint=FREE, magenta=RESTRICTED)
- **Alerts:** Left dot indicator, category-colored border (12px left border for emphasis), 13px text

## Decorative
- `.noise-overlay` — fixed SVG fractal noise 1.5% opacity z-9999 via `::after`
- `.bg-grid` — 1px white 2% grid lines, 64px spacing
- No ambient orbs. No decorative blobs. No gradients on backgrounds.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-04 | Initial design system created | Created by /design-consultation based on product context, competitive research, and north star: "team status in 3 seconds, built for builders, mint on black" |
| 2026-05-04 | Single-accent discipline (mint for everything) | Departure from multi-color SaaS norm. Makes the UI instantly recognizable — "mint = clickable" is learned once and never second-guessed |
| 2026-05-04 | Information density over whitespace | "3-second status" requires 12-16 member cards above the fold. Tight spacing serves the core use case |
| 2026-05-04 | No hero/marketing language in UI | Dashboard loads directly into member grid. First byte = actionable data. No welcome banners, tips panels, or getting-started sections |
