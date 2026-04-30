# StrideSync

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally (or set MONGO_URI to Atlas)
- Google Cloud project with Gmail API enabled

### Google OAuth Setup
1. Go to console.cloud.google.com
2. Create project → Enable Gmail API
3. OAuth 2.0 Credentials → Desktop App → Download JSON
4. Copy values into server/.env (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
5. Set GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/gmail/callback

### Run the App
```bash
# Terminal 1 — Backend
cd stridesync/server
cp .env.example .env
npm install
npm run dev

# Terminal 2 — Frontend
cd stridesync/client
npm install
npm run dev
```

Open http://localhost:5173

### First Login
- Go to http://localhost:5173
- Enter any email + password — this creates the Admin account
- From dashboard: Add Members, set category (FREE or RESTRICTED)
- For RESTRICTED members: click "Connect Gmail" once per member
- Members access their log at /member/:id using their 4-digit PIN

### How It Works
- Admin sees all members' progress in real time
- Each member logs updates once per hour (10 slots/day)
- RESTRICTED members: updates must mention job applications or agentic AI
- Gmail auto-detect scans sent folder + LinkedIn emails for job applications
- History page: view any past day for any member

## File Size Limits (for future edits)
Each source file is intentionally kept under 120 lines.
When adding features, create new files rather than expanding existing ones.
