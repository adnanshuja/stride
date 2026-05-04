# Admin Features Expansion

Date: 2026-05-04

## Overview

Three enhancements to the StrideSync admin experience: (1) course progress visible on the admin dashboard, (2) per-entry duration tracking when logging activity, and (3) admin activity view with date-range filtering.

---

## 1. Course Progress on Admin Dashboard

**Goal:** Each MemberCard on `/dashboard` shows the member's course progress — total topics, completed topics, total time spent.

### Backend

File: `server/routes/adminRoutes.js` — extend `GET /admin/dashboard`

After fetching all members and their todayLog, batch-fetch courses for all members in a single query:

```js
const courses = await Course.find({ memberId: { $in: memberIds } }).lean();
```

Build a map: `memberId → { totalCourses, totalTopics, completedTopics, totalCourseMinutes }`.

Attach as `courseStats` to each member in the response.

New member shape:
```js
{
  _id, name, category, gmailEmail, createdAt,
  todayLog: { ... } | null,
  courseStats: {
    totalCourses: 3,
    totalTopics: 12,
    completedTopics: 5,
    totalCourseMinutes: 480
  } | null  // null if no courses
}
```

### Frontend

File: `client/src/components/MemberCard.jsx`

Add a compact course stats line below the Progress bar, before the Gmail status line:

```
3 courses · 5/12 topics · 8h
```

- Text: `text-xs font-sans text-gray-500`
- Only shown when `member.courseStats` is non-null
- Uses same `formatMinutes` helper pattern (inline: if > 0, show `Xh Ym`)

---

## 2. Activity Logging with Duration

**Goal:** Each log entry can record a duration in minutes, separate from the slot count.

### Model

File: `server/models/DailyLog.js`

Add field:
```js
entryDurations: { type: Map, of: Number, default: {} }
```

Key = slot number (String), value = minutes (Number).

### API — `POST /logs/update`

File: `server/routes/logRoutes.js`

Accept optional body field `duration` (Number, minutes). Store in `entryDurations.{hour}`.

When span > 1, apply the duration to the first slot only (the entry's primary slot).

### API — GET endpoints

All GET endpoints (`/today/:memberId`, `/history/:memberId/:date`, `/recent/:memberId`, `/admin/activity/:memberId`) return the full DailyLog doc, so `entryDurations` is automatically included. No changes needed.

### Frontend — Add entry form

File: `client/src/pages/MemberPage.jsx`

Add a duration input next to the course selector in the add-entry section:

- `input type="number" min="0" max="480" placeholder="min"`
- Wrapped in a flex row alongside the course selector
- Stored in local state `logDuration`, default `''` (empty = no duration)
- Passed to `handleUpdate` as `duration` field
- Styling: same dark bg, border, rounded-lg as the course selector

### Frontend — Entry display

Each log entry shows duration if present:

```
#3  · 45min    [text]    [Course Badge]  Edit
```

- Duration styled as `text-[11px] text-gray-500 font-mono`
- Shows only when `entryDurations[slot]` is truthy
- Format: "Xmin" or "Xh Ymin" if >= 60

### Frontend — Edit mode

Duration input appears in the edit form alongside the course selector.

---

## 3. Admin Activity View with Date Range

**Goal:** Admin can select a member and date range to view all logged activity.

### Backend — New endpoint

File: `server/routes/adminRoutes.js`

```
GET /admin/activity/:memberId?start=YYYY-MM-DD&end=YYYY-MM-DD
```

- Middleware: `verifyToken, requireAdmin`
- Finds all DailyLog entries for the member where `date >= start && date <= end`
- Sorted by date ascending
- Includes summary aggregation:

```js
{
  logs: [ /* DailyLog docs, sorted by date asc */ ],
  summary: {
    daysActive: 5,
    totalEntries: 34,
    totalTrackedMinutes: 1020,
    startDate: "2026-04-28",
    endDate: "2026-05-04"
  }
}
```

Edge cases:
- Missing member → 404
- No logs in range → `{ logs: [], summary: { daysActive: 0, totalEntries: 0, totalTrackedMinutes: 0, startDate, endDate } }`
- Start > end → 400 error
- Member not belonging to this admin → verify via adminId check

### Frontend — Upgrade HistoryPage

File: `client/src/pages/HistoryPage.jsx`

Replace the single date input with a date range (start + end):

- Two date inputs: "From" and "To"
- Default: last 7 days (start = 7 days ago, end = yesterday)
- Keep existing member selector
- "View" button triggers `GET /admin/activity/:memberId?start=X&end=Y`

Results section:
- Summary bar at top: "12 entries · 8h tracked · 5 days active"
- Grouped by date, each group is a collapsible section with date header
- Each entry shows slot #, text, duration, course badge
- Empty state when no results

**Admin-only:** The member selector stays visible for admin. For member role (if accessed), lock to their own ID — though this page is primarily for admin use.

### Frontend — Dashboard shortcut

File: `client/src/components/MemberCard.jsx`

Add "Activity" button next to "View Log" that navigates to:
```
/history?member=<memberId>
```

HistoryPage reads URL params on mount and auto-selects the member.

---

## Implementation Order

1. Backend: add entryDurations to DailyLog model
2. Backend: add duration to POST /logs/update
3. Backend: add course aggregation to GET /admin/dashboard
4. Backend: add GET /admin/activity/:memberId
5. Frontend: update MemberCard with course stats
6. Frontend: update MemberPage with duration input
7. Frontend: upgrade HistoryPage to date range

---

## Non-Goals

- No new pages or routes — all changes extend existing pages/components
- No course creation from dashboard — courses remain per-member on MemberPage
- No export/CSV download
- No real-time updates
