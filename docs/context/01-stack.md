# Stack & Structure

## Server (`server/`) — port 5000
Entry: `index.js` — CORS, JSON, health at `/api/health`, then routes

| File | Mounts at |
|------|-----------|
| `routes/adminRoutes.js` | `/api/admin` |
| `routes/memberRoutes.js` | `/api/members` |
| `routes/logRoutes.js` | `/api/logs` |
| `routes/authRoutes.js` | `/api/auth` |
| `routes/scanRoutes.js` | `/api/scan` |
| `routes/courseRoutes.js` | `/api/courses` |
| `routes/jobRoutes.js` | `/api/jobs` |
| `middleware/auth.js` | verifyToken, requireAdmin, requireMember |
| `services/gmailScanner.js` | Gmail sent-folder parser |
| `services/linkedinScanner.js` | LinkedIn email parser |
| `config/db.js` | Mongoose connection |

`middleware/auth.js` exports: `{ verifyToken, requireAdmin, requireMember }`
- `verifyToken` → sets `req.user = { adminId|memberId, role, email }`
- `requireAdmin` → checks `req.user.role === 'admin'`
- `requireMember` → checks `req.user.role === 'member'`

## Client (`client/`) — port 5173
Entry: `main.jsx` → BrowserRouter > AuthProvider > ToastProviderWrapper > App
Auth context: `context/AuthContext.jsx` — `useAuth()` hook
Axios: `api/axios.js` — base `/api`, auto-attaches `Bearer <token>`

| Path | Component | Guard |
|------|-----------|-------|
| `/` | LoginPage | none |
| `/signup` | SignupPage | none |
| `/dashboard` | DashboardPage | ProtectedRoute |
| `/member/:memberId` | MemberPage | ProtectedRoute |
| `/history` | HistoryPage | ProtectedRoute |
