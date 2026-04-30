# Courses Feature

## Models → `03-models.md`
Course + Topic. Course has status: active|completed.

## Routes (verifyToken)
```
GET    /api/courses/:memberId
POST   /api/courses              body: { memberId, name, description }
PUT    /api/courses/:courseId    body: { name, description, status, completedComment }
DELETE /api/courses/:courseId    — also deletes all topics
GET    /api/courses/:courseId/topics
POST   /api/courses/:courseId/topics   body: { name, notes, order }
DELETE /api/courses/:courseId/topics/:topicId
```

## Business rules
- Completing a course: set `status=completed`, `completedAt=now`, `completedComment` required
- `totalTopics` on Course is a denormalized count — update on topic add/delete
- Topic `order` field controls display sequence
