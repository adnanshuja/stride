# Admin Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add course progress to admin dashboard, per-entry duration tracking, and date-range activity view.

**Architecture:** Three independent features sharing the DailyLog and Course models. Backend changes in adminRoutes/routes/logRoutes/DailyLog model; Frontend changes in MemberCard/MemberPage/HistoryPage.

**Tech Stack:** Express 4 + Mongoose 7 (backend), React 18 + Vite 5 (frontend), Lucide icons, Tailwind CSS.

---

### Task 1: Add entryDurations to DailyLog Model

**Files:**
- Modify: `server/models/DailyLog.js`

- [ ] **Step 1: Add entryDurations field**

Add after the `courseHours` field in the schema:

```js
entryDurations: {
  type: Map,
  of: Number,
  default: {},
},
```

The full schema after change will have fields: memberId, date, hours, courseHours, entryDurations, autoDetected, startedAt, breakCount, updatedAt.

- [ ] **Step 2: Verify model change**

Read the file and confirm the new field is present. No test needed — Mongoose schema changes are passive (new field just doesn't appear in existing docs until set).

- [ ] **Step 3: Commit**

```bash
git add server/models/DailyLog.js
git commit -m "feat: add entryDurations field to DailyLog model"
```

---

### Task 2: Add duration support to POST /logs/update

**Files:**
- Modify: `server/routes/logRoutes.js`

- [ ] **Step 1: Extract duration from request body**

In the `POST /update` handler, destructure `duration` from `req.body` alongside existing fields:

```js
const { memberId, hour, update, span, isBreak, courseId, duration } = req.body;
```

- [ ] **Step 2: Store duration in the upsert**

In the `hoursToFill` building loop, after the span loop adds hours entries, conditionally add the duration:

After the existing `if (courseId)` block inside the loop, add:

```js
if (duration) {
  hoursToFill[`entryDurations.${hour}`] = duration;
}
```

Note: when span > 1, only store duration on the first slot (`hour`, not `hour + i`), since the span copies the same text across multiple slots.

- [ ] **Step 3: Verify the change**

File should now accept `duration` field from the request and store it in `entryDurations.{hour}` within the DailyLog document.

- [ ] **Step 4: Commit**

```bash
git add server/routes/logRoutes.js
git commit -m "feat: add duration field to log entry route"
```

---

### Task 3: Add course aggregation to GET /admin/dashboard

**Files:**
- Modify: `server/routes/adminRoutes.js`
- Requires: Course model import

- [ ] **Step 1: Import Course model**

At the top of `adminRoutes.js`, add Course to the imports:

```js
const Course = require('../models/Course');
```

Add it in the existing require block alongside `Admin`, `Member`, `DailyLog`, `JobApplication`.

- [ ] **Step 2: Add course aggregation to dashboard endpoint**

After the `membersWithLogs` mapping and before `res.json(...)`, add course aggregation:

```js
// Aggregate course stats for all members
const memberIds = members.map((m) => m._id);
const courses = await Course.find({ memberId: { $in: memberIds } }).lean();
const courseStatsMap = {};
courses.forEach((c) => {
  const mid = c.memberId.toString();
  if (!courseStatsMap[mid]) {
    courseStatsMap[mid] = { totalCourses: 0, totalTopics: 0, completedTopics: 0, totalCourseMinutes: 0 };
  }
  courseStatsMap[mid].totalCourses++;
  courseStatsMap[mid].totalTopics += c.totalTopics || 0;
  courseStatsMap[mid].completedTopics += c.completedTopics || 0;
  courseStatsMap[mid].totalCourseMinutes += c.totalCourseMinutes || 0;
});

// Attach courseStats to each member
const membersWithStats = membersWithLogs.map((m) => ({
  ...m,
  courseStats: courseStatsMap[m._id.toString()] || null,
}));

res.json({ members: membersWithStats });
```

Replace the existing `res.json({ members: membersWithLogs })` with the new `res.json({ members: membersWithStats })`.

- [ ] **Step 3: Verify the response shape**

The response should now include `courseStats` on each member object. Members with no courses get `courseStats: null`. Members with courses get an object like `{ totalCourses: 2, totalTopics: 10, completedTopics: 4, totalCourseMinutes: 360 }`.

- [ ] **Step 4: Commit**

```bash
git add server/routes/adminRoutes.js
git commit -m "feat: add course aggregation to admin dashboard endpoint"
```

---

### Task 4: Add GET /admin/activity/:memberId endpoint

**Files:**
- Modify: `server/routes/adminRoutes.js`

- [ ] **Step 1: Add the activity endpoint**

Before the `module.exports = router;` line, add:

```js
// GET /activity/:memberId — date-ranged activity view (admin only)
router.get('/activity/:memberId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { memberId } = req.params;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end query params required (YYYY-MM-DD)' });
    }
    if (start > end) {
      return res.status(400).json({ error: 'start date must be before end date' });
    }

    // Verify member belongs to this admin
    const member = await Member.findOne({ _id: memberId, adminId: req.user.adminId });
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const logs = await DailyLog.find({
      memberId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 }).lean();

    // Compute summary
    let totalEntries = 0;
    let totalTrackedMinutes = 0;
    logs.forEach((log) => {
      const entryCount = Object.keys(log.hours || {}).filter((k) => log.hours[k] && !log.hours[k].startsWith('Break')).length;
      totalEntries += entryCount;
      if (log.entryDurations) {
        Object.values(log.entryDurations).forEach((mins) => {
          totalTrackedMinutes += mins || 0;
        });
      }
    });

    res.json({
      logs,
      summary: {
        daysActive: logs.length,
        totalEntries,
        totalTrackedMinutes,
        startDate: start,
        endDate: end,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

- [ ] **Step 2: Verify endpoint**

Check the route is registered after all other routes but before the export. Confirm error cases: missing params (400), invalid member (404), server error (500).

- [ ] **Step 3: Commit**

```bash
git add server/routes/adminRoutes.js
git commit -m "feat: add date-ranged activity endpoint for admin"
```

---

### Task 5: Update MemberCard with course stats

**Files:**
- Modify: `client/src/components/MemberCard.jsx`

- [ ] **Step 1: Add course stats display**

After the Progress bar element (around line 91) and before the Gmail status div, insert:

```jsx
{member.courseStats && (
  <div className="text-xs font-sans text-gray-500">
    {member.courseStats.totalCourses} course{member.courseStats.totalCourses !== 1 ? 's' : ''}
    {member.courseStats.totalTopics > 0 && (
      <> · {member.courseStats.completedTopics}/{member.courseStats.totalTopics} topics</>
    )}
    {member.courseStats.totalCourseMinutes > 0 && (
      <> · {Math.floor(member.courseStats.totalCourseMinutes / 60)}h {member.courseStats.totalCourseMinutes % 60}m</>
    )}
  </div>
)}
```

This adds a line like: "3 courses · 5/12 topics · 8h 0m" directly below the progress bar.

- [ ] **Step 2: Verify rendering**

The text should appear in gray `text-gray-500` at `text-xs` size. Only shows when `member.courseStats` is truthy. No courses = nothing shows.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/MemberCard.jsx
git commit -m "feat: show course stats on member cards in dashboard"
```

---

### Task 6: Update MemberPage with duration input

**Files:**
- Modify: `client/src/pages/MemberPage.jsx`

- [ ] **Step 1: Add logDuration state**

Add to the existing state declarations (around line 87-91):

```js
const [logDuration, setLogDuration] = useState('');
```

Also add `editDuration` state for the edit mode:

```js
const [editDuration, setEditDuration] = useState('');
```

- [ ] **Step 2: Pass duration to handleUpdate**

Update `handleLogSubmit` to pass duration:

```js
await handleUpdate(nextSlot, logText.trim(), 1, addCourseId || undefined, parseInt(logDuration) || undefined);
```

Update the `handleUpdate` function signature to accept and send duration:

```js
const handleUpdate = async (slot, text, span, courseId, duration) => {
  ...
  const payload = { memberId, hour: slot, update: text };
  if (span && span > 1) payload.span = span;
  if (courseId) payload.courseId = courseId;
  if (duration) payload.duration = duration;
  ...
};
```

- [ ] **Step 3: Add duration input to add-entry form**

In the add-entry form section, after the course selector and before the Log Entry button, add:

```jsx
{/* Duration input */}
<div className="flex items-center gap-1.5">
  <Clock className="w-3.5 h-3.5 text-gray-500" />
  <input
    type="number"
    min="0"
    max="480"
    value={logDuration}
    onChange={(e) => setLogDuration(e.target.value)}
    placeholder="min"
    className="w-16 bg-[#0C0E1D] border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs text-gray-400 font-mono focus:outline-none focus:border-[#51FAAA]/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
  />
</div>
```

Import `Clock` from lucide-react at the top if not already imported:

```js
import { ..., Clock } from 'lucide-react';
```

- [ ] **Step 4: Show duration in entry display**

Inside the entry display (the sortedEntries.map), after the course badge and before the Edit button, add:

```jsx
{entryDurations[slot] && (
  <span className="text-[11px] text-gray-500 font-mono shrink-0">
    {entryDurations[slot] >= 60
      ? `${Math.floor(entryDurations[slot] / 60)}h ${entryDurations[slot] % 60}m`
      : `${entryDurations[slot]}min`}
  </span>
)}
```

Make sure `entryDurations` is destructured from todayLog:

```js
const entryDurations = todayLog?.entryDurations || {};
```

- [ ] **Step 5: Add duration to edit mode**

In the edit form, after the course selector and before the Cancel/Save buttons, add:

```jsx
<div className="flex items-center gap-1.5">
  <Clock className="w-3 h-3 text-gray-500" />
  <input
    type="number"
    min="0"
    max="480"
    value={editDuration}
    onChange={(e) => setEditDuration(e.target.value)}
    placeholder="min"
    className="w-14 bg-[#0C0E1D] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-gray-400 font-mono focus:outline-none focus:border-[#51FAAA]/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
  />
</div>
```

Update `handleStartEdit` to also set editDuration:

```js
const handleStartEdit = (slot, text) => {
  setEditingSlot(slot);
  setEditText(text);
  setEditCourseId(courseHours[String(slot)] || '');
  setEditDuration(entryDurations[String(slot)] || '');
};
```

Update `handleSaveEdit` to pass duration:

```js
const handleSaveEdit = async () => {
  if (!editText.trim() || editingSlot === null) return;
  await handleUpdate(editingSlot, editText.trim(), 1, editCourseId || undefined, parseInt(editDuration) || undefined);
  setEditingSlot(null);
  setEditText('');
  setEditCourseId('');
  setEditDuration('');
};
```

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/MemberPage.jsx
git commit -m "feat: add duration tracking to log entries"
```

---

### Task 7: Upgrade HistoryPage to date-range activity view

**Files:**
- Modify: `client/src/pages/HistoryPage.jsx`

- [ ] **Step 1: Add date range state**

Replace `selectedDate` with start/end state. Change:

```js
const [selectedDate, setSelectedDate] = useState(defaultDate);
```

to:

```js
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
const [startDate, setStartDate] = useState(sevenDaysAgo.toISOString().slice(0, 10));
const [endDate, setEndDate] = useState(defaultDate);
const [activityData, setActivityData] = useState(null);
```

- [ ] **Step 2: Update handleView to use date range**

Replace the existing handleView:

```js
const handleView = async () => {
  if (!selectedMember) {
    addToast('Please select a member', 'error');
    return;
  }
  try {
    const { data } = await api.get(`/logs/history/${selectedMember}/${selectedDate}`);
    setLog(data);
    setViewed(true);
  } catch {
    setLog(null);
    setViewed(true);
  }
};
```

with:

```js
const handleView = async () => {
  if (!selectedMember) {
    addToast('Please select a member', 'error');
    return;
  }
  try {
    const { data } = await api.get(`/admin/activity/${selectedMember}`, {
      params: { start: startDate, end: endDate },
    });
    setActivityData(data);
    setViewed(true);
  } catch {
    setViewed(true);
  }
};
```

- [ ] **Step 3: Replace single date input with date range**

Replace the single date input in the filter bar:

```jsx
<div>
  <label className="text-[11px] font-sans text-gray-500 tracking-wider uppercase mb-1.5 block">Date</label>
  <Input
    type="date"
    value={selectedDate}
    onChange={(e) => setSelectedDate(e.target.value)}
    className="w-auto"
  />
</div>
```

with:

```jsx
<div>
  <label className="text-[11px] font-sans text-gray-500 tracking-wider uppercase mb-1.5 block">From</label>
  <Input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    className="w-auto"
  />
</div>
<div>
  <label className="text-[11px] font-sans text-gray-500 tracking-wider uppercase mb-1.5 block">To</label>
  <Input
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    className="w-auto"
  />
</div>
```

- [ ] **Step 4: Update results section for date-range data**

Replace the results section after `{viewed && (` with the new grouped-by-day layout:

```jsx
{viewed && activityData && (
  <div className="animate-fade-up animate-stagger-2 space-y-6">
    <div className="flex items-center gap-3">
      <div className="w-1 h-5 rounded-full bg-[#51FAAA]" />
      <h2 className="font-display text-xl text-white">{memberName}</h2>
      <span className="text-sm font-sans text-gray-500 flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" />
        {startDate} → {endDate}
      </span>
    </div>

    {/* Summary bar */}
    {activityData.summary && activityData.logs.length > 0 && (
      <div className="glass rounded-2xl px-5 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-display font-bold text-white">{activityData.summary.totalEntries}</span>
          <span className="text-xs text-gray-500 font-sans">entries</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-display font-bold text-[#51FAAA]">
            {Math.floor(activityData.summary.totalTrackedMinutes / 60)}h {activityData.summary.totalTrackedMinutes % 60}m
          </span>
          <span className="text-xs text-gray-500 font-sans">tracked</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-display font-bold text-white">{activityData.summary.daysActive}</span>
          <span className="text-xs text-gray-500 font-sans">days active</span>
        </div>
      </div>
    )}

    {activityData.logs.length === 0 ? (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] mb-4">
          <History className="w-7 h-7 text-gray-600" />
        </div>
        <p className="text-gray-500 font-sans text-sm">No entries in this date range.</p>
      </div>
    ) : (
      <div className="space-y-4">
        {activityData.logs.map((log) => {
          const entries = Object.entries(log.hours || {})
            .filter(([, text]) => text && !text.startsWith('Break'))
            .sort(([a], [b]) => Number(a) - Number(b));

          if (entries.length === 0) return null;

          return (
            <div key={log.date} className="glass rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.04] flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-sans text-gray-500 tracking-wider uppercase">
                  {new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </span>
                <span className="text-[11px] font-mono text-gray-600 ml-auto">{entries.length} entries</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {entries.map(([slot, text]) => {
                  const duration = log.entryDurations?.[slot];
                  const slotCourseId = log.courseHours?.[slot];
                  return (
                    <div key={slot} className="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                      <span className="font-mono text-xs text-gray-600 w-8 shrink-0">H{slot}</span>
                      <span className="font-sans text-sm text-white/80 flex-1">{text}</span>
                      {duration && (
                        <span className="text-[11px] text-gray-500 font-mono shrink-0">
                          {duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : `${duration}min`}
                        </span>
                      )}
                      {slotCourseId && (
                        <span className="text-[10px] text-[#51FAAA] font-mono px-2 py-0.5 rounded-full bg-[#51FAAA]/10">Course</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}
```

- [ ] **Step 5: Read URL params on mount**

Add params reading at mount time so the "Activity" button from MemberCard works:

```js
useEffect(() => {
  const member = searchParams.get('member');
  if (member) setSelectedMember(member);
}, []);
```

Make sure `searchParams` is accessible. Replace the import to use `useSearchParams`:

```js
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
```

Also import `History` and `Clock` from lucide-react if not already there.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/HistoryPage.jsx
git commit -m "feat: upgrade history page with date range activity view"
```

---

### Task 8: Add Activity shortcut button to MemberCard

**Files:**
- Modify: `client/src/components/MemberCard.jsx`

- [ ] **Step 1: Add Activity button next to View Log**

In the actions section, after the View Log button and before the menu trigger, add:

```jsx
<Button
  variant="outline"
  size="sm"
  onClick={() => navigate(`/history?member=${member._id}`)}
>
  <Clock className="w-3 h-3 mr-1" />
  Activity
</Button>
```

Import `Clock` from lucide-react at the top.

- [ ] **Step 2: Commit**

```bash
git add client/src/components/MemberCard.jsx
git commit -m "feat: add activity shortcut button to member card"
```

---

### Task 9: Update context docs

**Files:**
- Modify: `docs/context/02-routes.md` — add the new `/admin/activity/:memberId` route
- Modify: `docs/context/03-models.md` — add `entryDurations` to DailyLog

- [ ] **Step 1: Update routes doc**

Add to the admin routes section:
```
GET    /admin/activity/:memberId?start=&end= — verifyToken+requireAdmin — date-ranged activity entries + summary
```

- [ ] **Step 2: Update models doc**

Add `entryDurations` to the DailyLog table:
```
| entryDurations | Map<String,Number> | slot → minutes |
```

- [ ] **Step 3: Commit**

```bash
git add docs/context/02-routes.md docs/context/03-models.md
git commit -m "docs: update context docs for new admin features"
```

---

## Spec Coverage Check

- **Course progress on admin dashboard** → Task 3 (backend aggregate) + Task 5 (frontend MemberCard)
- **Per-entry duration on log entries** → Task 1 (model) + Task 2 (route) + Task 6 (frontend MemberPage)
- **Date-range activity view** → Task 4 (endpoint) + Task 7 (HistoryPage upgrade) + Task 8 (shortcut button)
- **Context docs** → Task 9
