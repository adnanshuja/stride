# Scan Feature

## Trigger
POST `/api/scan/:memberId` — RESTRICTED members only, requires `gmailRefreshToken` on member doc.
Returns `{ results: [...], count }` or `{ error, needsAuth: true }`.

## Gmail Scanner (`services/gmailScanner.js`)
- Method: `scanSentFolder(memberId)`
- Query: `in:sent after:today before:tomorrow (subject:application OR subject:applied OR ...)`
- Parses: company from recipient email domain, role from subject regex
- Silent failure: returns `[]` on error

## LinkedIn Scanner (`services/linkedinScanner.js`)
- Method: `scanLinkedInEmails(memberId)`
- Query: `from:jobs-noreply@linkedin.com after:today before:tomorrow (subject:applied OR subject:"application was sent")`
- Parses: company + role from subject patterns ("applied to X at Y")
- Silent failure: returns `[]` on error

## Dedup
Results deduplicated by `rawSubject` before pushing to `DailyLog.autoDetected`.

## autoDetected shape
```js
{ source: 'gmail_sent'|'linkedin', company, role, time: 'HH:mm', hour, rawSubject }
```

## ScanButton component states
- `idle` — button visible for RESTRICTED only (null for FREE)
- `scanning` — spinner
- `results` — list: source icon (Globe=LinkedIn, Mail=Gmail), role, company, time, badge
- `needs-auth` — redirects to `/api/auth/gmail/init/:memberId`
