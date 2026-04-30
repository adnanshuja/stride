# Member Data Entry Redesign

**Date:** 2026-04-30
**Status:** Approved design

## Overview

Redesign the member hourly logging experience for StrideSync, targeting a job-seeking cohort where most members are RESTRICTED category. The current system requires manually typing text into a single editable slot per hour. The redesign makes logging faster, more flexible, and better integrated with auto-detection.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Approach | B+C — Smart Timeline + Daily Session (natural landing page) |
| Entry mechanism | Action buttons pre-fill editable template text |
| Slot editability | Full — all 10 slots always editable (past, present, future) |
| Scan integration | Inline chips per slot, auto-scanned on page load |
| Breaks | Explicit "Break" action, keywords not validated |
| Multi-hour spans | Duration selector (1h–4h) auto-fills subsequent slots |
| Color contrast | Reduced transparency/glow for readability |
| Member auth | Email + password with admin-generated signup codes. Replaces PIN. |

## Member Auth: Email + Password with Signup Codes

Replace PIN-based authentication with email + password. Admins create members with an email and receive a one-time signup code to share. Members complete registration with email + password, then login normally.

### Member Model Changes

Add to `models/Member.js`:
- `email` (String, required, unique) — member's email for login
- `passwordHash` (String, nullable, set on signup) — bcrypt hash
- `signupCode` (String, nullable, bcrypt hashed) — one-time code set by admin
- `signupCodeExpires` (Date, nullable) — code expires 7 days after creation
- `isActive` (Boolean, default: false) — becomes true after successful signup

Remove from `models/Member.js`:
- `pin` — replaced by email+password auth

### Signup Flow

1. Admin creates member via POST /api/members with `{ name, email, category }`
2. Server auto-generates an 8-character alphanumeric signup code, bcrypt-hashes it, sets `signupCodeExpires` to +7 days
3. Admin sees the code on the dashboard (displayed once, with copy button)
4. Member visits /signup (new page), enters email + password + signup code
5. Server validates: code matches hash, code not expired, email matches member
6. On success: passwordHash set, isActive=true, signupCode cleared
7. Member redirected to /login (Member tab) to sign in

### Login Flow

- POST /api/auth/member/login — `{ email, password }` → `{ token, memberId, name, category }`
- JWT payload: `{ memberId, role: 'member' }`, expires 24h
- Token stored in localStorage key `ss_member_token`, member info in `ss_member`
- Admin and member tokens coexist — admin uses `ss_token`, member uses `ss_member_token`
- Axios interceptor: attach admin token (`ss_token`) if available, otherwise member token (`ss_member_token`)

### Backend Middleware

- `verifyToken` — validates any valid JWT (admin or member), decodes to `req.user`
- New `requireAdmin` — checks `req.user.role === 'admin'`
- New `requireMember` — checks `req.user.role === 'member'`
- Admin CRUD routes: `requireAdmin` (stricter than current)
- Log update/today routes: `verifyToken` (accepts both admin and member)
- Log history routes: `verifyToken` (accepts both)
- Scan routes: `requireAdmin` or `requireMember` based on context

### Frontend Auth Changes

- `AuthContext.jsx` — add `memberLogin(email, password)`, `memberLogout()`, `isMember` state
- `LoginPage.jsx` — Member tab: email + password fields (replaces name + PIN)
- New page `SignupPage.jsx` — email + password + signup code form
- New route `/signup` added to router
- `MemberPage.jsx` — remove PIN gate entirely. Protected by checking `ss_member_token` or `ss_token` (admin override). If neither, redirect to login.

### Edge Cases
- **Expired signup code**: Show "Code expired — contact your admin" with resend link (resend regenerates code)
- **Already signed up**: Member tries /signup again → "Already registered. Please log in."
- **Wrong email for code**: "This code belongs to a different email address."
- **Admin deletes member**: Member JWT invalidated on next request (token no longer references valid memberId)

## Member Page Layout

### Header Section
- Avatar, member name, category badge (RESTRICTED mint green, FREE magenta)
- Top-right navigation: Today / History toggle buttons
- Editable "Today's focus" line — subtle bordered input

### Global Quick Actions Bar
Horizontal row of pill buttons, always visible above the timeline:
- **Applied** (mint) — pre-fills "Applied to ___". Contains keyword "applied".
- **Studied** (blue) — pre-fills "Studied course: ___". Contains keyword "course".
- **Interview** (amber) — pre-fills "Interview at ___". Contains keyword "interview".
- **Prep** (purple) — pre-fills "Preparing for ___". Manual text must include a keyword (member can type the company/course name which often contains keywords like "AI", "LLM", "agent").
- **Networking** (gray) — pre-fills "Networking: ___". Manual text must include a keyword.
- **Other** (gray) — pre-fills blank textarea. Manual text must include a keyword.
- **Break** (orange with ☕ icon) — logs a break, skips keyword validation

### Hourly Timeline
All 10 slots (H1–H10, 8AM–5PM) visible as a vertical list. Every slot is always editable with the following visual states:

**Filled/Logged slot** (mint border, green text):
- Shows entry text with hour label
- Edit button (opens inline edit mode)
- If part of a span: shows merged H1–H2 block with "2h span" indicator and Unspan button

**Missed slot** (rose/dim border):
- "Tap to fill" prompt
- Click opens the same action-buttons + template + duration selector as the current slot

**Current slot** (mint border, pulse indicator):
- Inline scan chips (auto-detected results from Gmail/LinkedIn shown as "+" chips)
- Quick action buttons row
- Editable template text input (pre-filled by action button tap)
- Duration dropdown (1h up to remaining slots, max 4h) — auto-fills subsequent slots. Caps at remaining slots in the day (e.g., H9 at most 2h).
- Log button (mint, dark text)

**Break slot** (amber border):
- ☕ icon + "Break —" text
- Break badge
- Edit button
- No keyword validation required

**Future slot** (dim border):
- "Tap to plan ahead" prompt
- Click opens the same editing interface

### Member History Section
Horizontal scrollable carousel below the timeline:
- Each card shows: date, fill count (e.g., "6/10"), mini progress bar, app detection count
- Left/right arrows for date range navigation
- Current day highlighted with mint border
- Clicking a card opens that day's detailed view in the timeline area

### Utility Bar
Row of secondary action buttons below the timeline:
- Copy from Yesterday — fills empty slots only (does not overwrite existing entries) from prior day's entries
- Scan Gmail & LinkedIn — manual scan trigger (auto-runs on page load)
- End of Day Summary — collapsible view showing: total hours filled, entries grouped by type (applications vs study vs other), auto-detected matches, and a "Today's focus" recap. Non-editable — read-only glance.

## RESTRICTED Keyword Validation

- Break entries: no validation
- Action button templates: designed to contain valid keywords ("Applied", "Studied" → "course" matching, "Interview", "Prep")
- Manual text edits: validated against member's `restrictedKeywords` list as before
- Error displayed inline on the slot if validation fails

## Scan Integration

- Auto-scan on page load (Gmail + LinkedIn) for RESTRICTED members
- Results shown as inline chips on the current/nearest empty slot
- Each chip: "+ [role] @ [company]" — click to pre-fill template
- Scan results also listed in a collapsed section below the timeline

## Data Flow Changes

### New/Modified API Endpoints

**POST /api/logs/update** (extended)
- Auth: `verifyToken` (member or admin JWT — replaces PIN auth)
- Add optional `span` field (number, 1–4) to fill multiple consecutive hours
- Breaks: accept empty or "Break" + optional note text; skip keyword validation
- Returns updated DailyLog

**GET /api/logs/today/:memberId** (no change)
- Auth: `verifyToken` (member or admin JWT)

**GET /api/logs/history/:memberId/:date** (no change)
- Auth: `verifyToken` (member or admin JWT)

**GET /api/members/:memberId/logs/recent** (new)
- Auth: `verifyToken` (member or admin JWT)
- Returns last 7 days of DailyLogs for the member
- Used by the Past Days carousel
- Each entry: date, fill count, autoDetected count

**POST /api/auth/member/signup** (new)
- Body: `{ email, password, signupCode }`
- Validates signupCode, sets passwordHash, activates member
- Returns `{ success: true }`

**POST /api/auth/member/login** (new)
- Body: `{ email, password }`
- Returns `{ token, memberId, name, category }`

**POST /api/members** (admin, extended)
- Body now includes `email` (required)
- Server adds auto-generated signupCode to response
- Response includes `signupCode` field for admin to share

**POST /api/members/find-by-pin** (removed)
- Replaced by email + password auth

**POST /api/members/:memberId/verify-pin** (removed)
- Replaced by JWT auth

### Frontend State Changes

- MemberPage stores a `logsCache` object (date → DailyLog) to minimize API calls when browsing history
- Member JWT stored in `ss_member_token`, member info in `ss_member` (separate from admin tokens)
- Auto-scan triggers once when the member page mounts (not on every re-render)

## Component Architecture

New components to create:
- **QuickActions** — row of action buttons + duration selector
- **TimelineSlot** — individual slot component handling all states (logged, missed, current, break, future)
- **SlotEditor** — inline editor with action buttons, template, duration, submit
- **BreakSlot** — break-specific slot variant
- **SpanBlock** — merged multi-hour span display
- **MemberHistory** — past days carousel section
- **FocusInput** — editable "Today's focus" line
- **ScanChip** — inline auto-detected result chip
- **SignupPage** — email + password + signup code form (new page)
- **MemberLoginForm** — rewritten: email + password (replaces name + PIN form)

Modified components:
- **MemberPage** — major restructure: remove PIN gate, add history section, auto-scan, focus line, protect with JWT
- **HourlyGrid** — replaced by new TimelineSlot-based system
- **ScanButton** — kept as utility trigger, but inline chips take primary role
- **AuthContext** — add memberLogin, memberLogout, isMember state, dual-token management
- **LoginPage** — Member tab: email + password fields (replaces name + PIN)

## States & Edge Cases

### Loading States
- **Page load**: Full-page skeleton (header + 3 placeholder slot blocks + shimmer animation)
- **Auto-scan in progress**: Chip area shows "Scanning..." with spinner; results appear incrementally
- **History navigation**: Date carousel shows skeleton cards while fetching; timeline shows loading overlay
- **Submit in progress**: Log button shows spinner; slot is non-interactive until resolved

### Empty States
- **No members loaded**: Redirect to dashboard with toast (shouldn't happen — member page is member-specific)
- **No entries today**: All slots show "Tap to fill" except current (shows editor) and future (shows "Tap to plan")
- **Empty history (new member)**: Past Days section shows a single card: "No history yet"
- **No scan results**: Inline chip area hidden; Scan utility button shows "No new results" on click

### Error States
- **Session expired / invalid token**: Redirect to login page with error toast "Session expired. Please log in again."
- **Network failure on submit**: Rose inline banner on the slot: "Failed to save — [error]. Retry?"
- **Network failure on load**: Retry banner at top of page with "Retry" button; cached data shown if available
- **Scan auth failure**: Redirect to Gmail OAuth flow (existing behavior); toast explains why
- **Span conflict**: If target slot for a span already has content, show confirmation dialog: "H3 already has an entry. Overwrite?"

### Edge Cases
- **Span overlap**: If a member sets a 3-hour span starting at H4, but H5 already has an entry, show conflict resolution
- **Editing a spanned entry**: Editing breaks the span into individual slots unless the edit is to all spanned slots
- **Day boundary**: At midnight, today's page resets; yesterday's data moves to history
- **Browser refresh**: JWT persists in localStorage (24h expiry). Member stays logged in. Slot state re-fetched from API.
- **Rapid double-submit**: Log button disabled during submission; debounced
- **Very long entry text**: Truncated at 200 chars in timeline display; full text visible on edit
- **Admin views member page**: Admin JWT (`ss_token`) grants access to any member's page. Admin sees same layout as member but with additional "View as admin" indicator.

## Performance Considerations

- History carousel: lazy-load dates on scroll, cache in `logsCache`
- Auto-scan: debounced to once per session (not on every mount/unmount cycle)
- Timeline rendering: virtualize if member count grows, but small-team assumption holds
- API calls: batch recent history fetch into single call rather than 7 separate calls

## Future Considerations (Out of Scope)

- Push notifications for missed slots
- Weekly streak tracking and achievements
- Export logs as CSV/PDF
- Mobile app
- Multi-admin teams
- Timezone support for distributed teams
