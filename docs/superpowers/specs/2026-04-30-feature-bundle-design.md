# Feature Bundle Design — Email Verification, Admin Restrictions, Start Day, Courses, Jobs

## 1. Email Verification [IMPLEMENTED]

**Problem:** Members can sign up with a code from admin but there's no email verification step.

**Design:**
- Add `emailVerified: Boolean (default: false)` to Member model
- When admin creates a member, the signup code is returned as before
- Add optional email sending via nodemailer (if SMTP is configured in .env)
- On member signup (`POST /auth/member/signup`): after successful code validation, also mark `emailVerified = true`
- Add resend-verification endpoint
- Login checks `isActive` (already done) — no separate gate for emailVerified

**Why:** Keeps friction low. The signup code already serves as verification. emailVerified is for future use (e.g., password reset).

## 2. Admin Restrictions [IMPLEMENTED]

**Problem:** Admin can currently POST to `/api/logs/update` (any authenticated user can).

**Design:**
- POST `/api/logs/update` gets `requireMember` middleware added
- GET log routes remain accessible to both admin and members (viewing is fine)
- DELETE member remains admin-only (already is)
- Admin viewing a member page sees logs but cannot submit updates
- Frontend: MemberPage checks `isAdminView` and disables slot editing when true

## 3. Start Day / Dynamic Slots [IMPLEMENTED]

**Problem:** Slots are fixed 8AM-5PM (hours 1-10). Users want to explicitly start their day.

**Design:**
- Add `startedAt: String (HH:mm)` and `breakCount: Number (default: 0)` to DailyLog
- Member clicks "Start Day" button → sets startedAt to current time in HH:mm format
- Slots are calculated relative to startedAt:
  - Slot N = startedAt + (N-1) hours
  - Max 10 base slots + breakCount extra slots
  - Current slot = hours since start time
- Break: when a break is logged, increment breakCount (adds one extra slot to the day)
- API: POST `/api/logs/start-day` — sets startedAt for today's log
- API: POST `/api/logs/update` — updated to handle dynamic slot numbers
- Dashboard: totalPossible = (10 + breakCount) per member
- If no startedAt, fall back to old behavior (9AM start implied)

## 4. Course Tracking [IMPLEMENTED]

**Problem:** No way to track learning courses with topics.

**Design:**
- New model `Course`: memberId, name, description, status (active/completed), completedAt, completedComment, totalTopics, createdAt
- New model `Topic`: courseId, name, notes, order, createdAt
- API routes under `/api/courses`:
  - GET /:memberId — list courses
  - POST / — create course
  - PUT /:courseId — update (status, name, etc.)
  - DELETE /:courseId — delete course + topics
  - GET /:courseId/topics — list topics
  - POST /:courseId/topics — add topic
  - DELETE /:courseId/topics/:topicId — delete topic
- Frontend: CoursesSection component on MemberPage
  - "Add Course" button → modal/panel with name + description
  - Course card shows name, topics count, status badge
  - Expand course to see topics list
  - "Add Topic" button per course
  - "Mark Complete" button → modal with textarea for "what I learned"
  - Completed courses show green badge and learned comment

## 5. Job Application Tracking [IMPLEMENTED]

**Problem:** Job apps are only auto-detected from Gmail/LinkedIn, no manual entry or tracking.

**Design:**
- New model `JobApplication`: memberId, company, role, source (linkedin/gmail/direct/link), url, notes, status (applied/interviewed/rejected/offered), date, createdAt
- API routes under `/api/jobs`:
  - GET /:memberId — list jobs
  - POST / — create job
  - PUT /:jobId — update status/notes
  - DELETE /:jobId — delete
- Frontend: JobsSection component on MemberPage
  - "Add Application" form with fields: company, role, source dropdown, URL, notes
  - Job cards with status badges (color-coded)
  - Status update buttons (applied → interviewed → offered/rejected)
  - Integration with existing scanner: auto-detected apps also create JobApplication entries
