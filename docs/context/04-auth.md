# Auth

## Admin auth
- Login: POST `/api/admin/login` → JWT stored in localStorage `ss_token` + `ss_admin`
- First login bootstraps admin (no pre-existing account needed)
- JWT expires 24h
- Protected routes use `ProtectedRoute` component → redirects to `/` if no token

## Member auth (current)
- Signup flow: admin creates member → sends signupCode → member hits `/signup` with code
- Login: POST `/api/auth/member/login` → JWT stored in `ss_token` + `ss_member`
- Resend code: POST `/api/auth/admin/resend-code/:memberId` (admin only)
- Member JWT payload: `{ memberId, role: 'member', email }`
- Admin JWT payload: `{ adminId, role: 'admin', email }`

## Middleware chain
```
verifyToken → requireAdmin   (admin-only routes)
verifyToken → requireMember  (member-only routes e.g. POST /api/logs/update)
verifyToken                  (shared routes e.g. GET /api/logs/today/:id)
```

## Gmail OAuth
- Init: GET `/api/auth/gmail/init/:memberId` → redirect to Google consent
- Scope: gmail.readonly
- Callback: GET `/api/auth/gmail/callback` → stores refreshToken+email on Member doc
- On success: redirects to `/dashboard?gmailConnected=true`
- If no refreshToken: scan returns `{ error, needsAuth: true }` → client redirects to init

## Legacy PIN (deprecated)
- 4-digit numeric bcrypt-hashed on Member doc
- Still present in DB, do not remove — some routes may still use it
- New features must use JWT flow
