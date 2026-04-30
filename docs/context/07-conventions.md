# Conventions

## Rules
- Files: max 120 lines — new feature = new file, never expand existing
- Components: default export, forwardRef on Radix wrappers, DisplayName set
- Styling: `cn()` from `lib/utils.js` everywhere
- Icons: lucide-react, w-4 h-4 default, w-3/w-3.5 smaller
- API calls: `api/axios.js` instance, always try/catch
- No packages without asking. No schema changes without confirming.
- Lint before commit: `npm --prefix client run lint`

## Patterns
```js
// Toast
const { addToast } = useToast()
addToast('message', 'success'|'error'|'default', 3000)

// API
import api from 'api/axios.js' // auto JWT
const { data } = await api.get('/logs/today/123')

// cn()
import { cn } from 'lib/utils.js'
className={cn('base-class', condition && 'conditional-class')}
```

## Environment (`server/.env`)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/stridesync
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/gmail/callback
```

## Known limitations
- No pagination (small teams, <50 members)
- Scan: today only, no historical re-scan
- No rate limiting on login
- No error boundary component
- Toast: setTimeout dismiss only (no swipe)
- History defaults to yesterday
