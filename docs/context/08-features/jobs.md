# Job Applications

Tracks member job applications via JobApplication model. Each entry: company, role, source (linkedin/gmail/direct/link), status (applied/interviewed/rejected/offered).

## Per-member (MemberPage → JobsSection)
- Members can add/edit/delete job applications
- Fields: company, role, source, URL, notes, status
- Listed on MemberPage below courses

## Admin Dashboard aggregation `GET /api/admin/dashboard/jobs`
Returns across all members:
- `totalApplications` — lifetime total
- `thisWeek` — count since Monday
- `byStatus` — {applied, interviewed, rejected, offered}
- `bySource` — {linkedin, gmail, direct, link}
- `weeklyTrend` — [{date, count}] for last 7 days
- `perMember` — [{_id, name, total, applied, interviewed, rejected, offered}]

## UI Components
- `JobsPipeline` (dashboard/) — stacked proportional bar + conversion rates
- `WeeklyJobsBar` (dashboard/) — 7-day bar chart matching WeeklyMiniBars style
- StatsRow includes "Applications" card with total + this week count
