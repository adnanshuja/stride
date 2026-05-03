# StrideSync Quickref
Stack: React18+Vite5 / Express4+Mongoose7 / MongoDB / JWT
Ports: client=5173 server=5000, proxy /api→5000
Auth: Admin=JWT(ss_token+ss_admin) Member=JWT(ss_token+ss_member) — PIN is legacy/deprecated
Slots: dynamic based on member `startedAt` time — NOT fixed 8AM–5PM
Members: FREE (no restrictions) or RESTRICTED (must log job/AI keywords)
Styling: cn() always | See DESIGN.md for full system | mint=#51FAAA | magenta=#FF81FF | bg=#0C0E1D | surface=#1A1C2E | raised=#211F36
Fonts: Inter(body) Sora(display) JetBrains Mono(mono)
Files: max 120 lines — new feature = new file
Toast: `addToast('msg', 'success'|'error'|'default', 3000)` via `useToast()`
API: `import api from 'api/axios.js'` — auto JWT, always try/catch
Icons: lucide-react, w-4 h-4 default
Pages: Login(/) Signup(/signup) Dashboard(/dashboard) Member(/member/:id) History(/history)
Layout: w-full px-6 lg:px-10 max-w-[90rem] | nav: max-w-[90rem] sticky pill
Dashboard sections: StatsRow + WeeklyMiniBars + ActivityHighlights + TeamRing + MemberCards
