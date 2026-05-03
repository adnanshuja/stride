# Courses Feature

## Models → `03-models.md`
Course + Topic. Course has status: active|completed, totalCourseMinutes (denormalized sum of topic timeSpent).
Topic has status: active|completed, timeSpent (minutes), completedAt.

## Routes (verifyToken)
```
GET    /api/courses/:memberId
POST   /api/courses              body: { memberId, name, description }
PUT    /api/courses/:courseId    body: { name, description, status, completedComment }
DELETE /api/courses/:courseId    — also deletes all topics
GET    /api/courses/:courseId/topics
POST   /api/courses/:courseId/topics   body: { name, notes, order }
PUT    /api/courses/:courseId/topics/:topicId  body: { name, notes, status, timeSpent }
DELETE /api/courses/:courseId/topics/:topicId
```

## Business rules
- Completing a course: set `status=completed`, `completedAt=now`, `completedComment` required
- `totalTopics` + `completedTopics` + `totalCourseMinutes` on Course are denormalized — update on topic add/delete/status-change
- Topic `order` field controls display sequence
- Toggling topic status → `active`/`completed` auto-sets `completedAt` and updates course `completedTopics` count
- Time spent per topic stored in minutes, editable inline via blur-save
- Course total time shown as "Xh Ym" on course card; aggregate shown in section header and MemberPage daily stats
