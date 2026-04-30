# StrideSync
React+Vite / Express+MongoDB / JWT auth. Monorepo: `client/` + `server/`.
For context, see `docs/context` folder. Never load all chunks. Load `00-quickref` always, then max 2 others.

## Load rules

| Task | Load |
|------|------|
| Any task | `00-quickref.md` |
| Stack, folders, ports | `01-stack.md` |
| API endpoint work | `02-routes.md` |
| Schema / model changes | `03-models.md` |
| Auth, JWT, OAuth, signup | `04-auth.md` |
| UI components / pages | `05-frontend.md` |
| Colors, styling, animations | `06-ui.md` |
| Patterns, limits, env vars | `07-conventions.md` |
| Gmail/LinkedIn scan | `08-features/scan.md` |
| Courses or topics | `08-features/courses.md` |
| Job applications | `08-features/jobs.md` |

## Hard rules
- Never install packages without asking
- Never run migrations without confirming
- Always lint before commit: `npm --prefix client run lint`
- Update the context at the end of every task completion. 