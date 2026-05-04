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
| Design system / UI tokens | `DESIGN.md` |

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## UI/UX
Always invoke the `ui-ux-pro-max` skill before any UI/UX work — designing,
implementing, animating, or reviewing. Follow its workflow: analyze
requirements → generate design system → search domains → implement.

## Hard rules
- Never install packages without asking
- Never run migrations without confirming
- Always validate before commit: `npm --prefix client run build`
- Update the context at the end of every task completion. 