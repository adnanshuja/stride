# Job Applications Feature

## Model → `03-models.md`
JobApplication — source: linkedin|gmail|direct|link, status: applied|interviewed|rejected|offered

## Routes (verifyToken)
```
GET    /api/jobs/:memberId
POST   /api/jobs              body: { memberId, company, role, source, url, notes, status, date }
PUT    /api/jobs/:jobId       body: any subset of above
DELETE /api/jobs/:jobId
```

## Business rules
- `date` format: YYYY-MM-DD
- `source=gmail|linkedin` — typically auto-populated from scan results
- `source=direct|link` — manually entered by member
- Status flow: applied → interviewed → rejected|offered
- No unique constraint — same company/role can exist multiple times
