# API Routes

Format: `METHOD path — auth — notes`

## Public
```
POST /api/admin/login          — none        — bootstrap or login, returns JWT 24h
POST /api/auth/member/signup   — none        — complete signup with code
POST /api/auth/member/login    — none        — returns JWT + member info
POST /api/auth/admin/resend-code/:memberId — verifyToken+requireAdmin
GET  /api/auth/gmail/init/:memberId        — none — redirect to Google OAuth
GET  /api/auth/gmail/callback              — none — stores refreshToken, redirects
```

## Admin (verifyToken + requireAdmin)
```
GET    /api/admin/dashboard             — all members + today's log each
GET    /api/admin/dashboard/weekly      — last 7 days hours aggregation {days}
GET    /api/admin/dashboard/jobs        — aggregated job stats {totalApplications, thisWeek, byStatus, bySource, weeklyTrend, perMember}
POST   /api/members                     — create member, body: {name,email,category}
GET    /api/members                     — list all members
GET    /api/members/:memberId           — single member
DELETE /api/members/:memberId           — delete member + all logs
```

## Logs (verifyToken)
```
POST /api/logs/update              — requireMember — upsert hour, body: {hour, update}
GET  /api/logs/today/:memberId     — today's log or {hours:{}, autoDetected:[]}
GET  /api/logs/history/:memberId/:date — log for YYYY-MM-DD
GET  /api/logs/recent/:memberId    — last 7 days summary
```

## Courses (verifyToken)
```
GET    /api/courses/:memberId
POST   /api/courses                — body: {memberId, name, description}
PUT    /api/courses/:courseId
DELETE /api/courses/:courseId      — deletes topics too
GET    /api/courses/:courseId/topics
POST   /api/courses/:courseId/topics
DELETE /api/courses/:courseId/topics/:topicId
```

## Jobs (verifyToken)
```
GET    /api/jobs/:memberId
POST   /api/jobs
PUT    /api/jobs/:jobId
DELETE /api/jobs/:jobId
```

## Scan (verifyToken)
```
POST /api/scan/:memberId   — RESTRICTED only, needs gmailRefreshToken
                             returns {results, count} or {error, needsAuth:true}
```
