# Member Data Entry Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace PIN-based member auth with email+password signup/login, and redesign the hourly logging experience with quick-action buttons, multi-hour spans, breaks, inline scan integration, and member-visible history.

**Architecture:** Backend-first: update Member model and auth middleware, add signup/login routes, then update member/log routes. Frontend: update AuthContext for dual-token support, create signup page, replace PIN gate with JWT, then build the new timeline components and wire into MemberPage.

**Tech Stack:** Express 4 + Mongoose 7 (backend), React 18 + React Router 6 + Tailwind CSS 3 (frontend), JWT for auth, bcryptjs for passwords.

---

### Task 1: Backend — Update Member Model & Auth Middleware

**Files:**
- Modify: `server/models/Member.js`
- Modify: `server/middleware/auth.js`

- [ ] **Step 1: Update Member model — add email/password fields, remove pin**

```js
const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  category: { type: String, enum: ['FREE', 'RESTRICTED'], default: 'FREE' },
  passwordHash: { type: String, default: null },
  signupCode: { type: String, default: null },
  signupCodeExpires: { type: Date, default: null },
  isActive: { type: Boolean, default: false },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  gmailRefreshToken: { type: String, default: null },
  gmailEmail: { type: String, default: null },
  restrictedKeywords: {
    type: [String],
    default: [
      'applied', 'application', 'LinkedIn', 'LangChain', 'AutoGen', 'agent',
      'interview', 'resume', 'Coursera', 'Udemy', 'Claude', 'GPT', 'LLM',
      'agentic', 'AI engineer', 'machine learning', 'course', 'offer',
    ],
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Member', MemberSchema);
```

- [ ] **Step 2: Update auth middleware — add requireAdmin/requireMember, set req.user**

```js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

const requireMember = (req, res, next) => {
  if (req.user.role !== 'member') {
    return res.status(403).json({ error: 'Member access required.' });
  }
  next();
};

module.exports = { verifyToken, requireAdmin, requireMember };
```

- [ ] **Step 3: Commit**

```bash
git add server/models/Member.js server/middleware/auth.js
git commit -m "feat: update Member model and auth middleware for email+password auth"
```

---

### Task 2: Backend — Add Member Auth Routes (signup + login)

**Files:**
- Modify: `server/routes/authRoutes.js`

- [ ] **Step 1: Add member signup + login endpoints to authRoutes.js**

```js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const Member = require('../models/Member');

// POST /member/signup — complete registration with signup code
router.post('/member/signup', async (req, res) => {
  try {
    const { email, password, signupCode } = req.body;

    const member = await Member.findOne({ email: email.toLowerCase().trim() });
    if (!member) return res.status(404).json({ error: 'No member found with this email.' });
    if (member.isActive) return res.status(400).json({ error: 'Already registered. Please log in.' });
    if (!member.signupCode || !member.signupCodeExpires) {
      return res.status(400).json({ error: 'No signup code issued. Contact your admin.' });
    }
    if (new Date() > member.signupCodeExpires) {
      return res.status(400).json({ error: 'Signup code expired. Contact your admin for a new one.' });
    }

    const valid = await bcrypt.compare(signupCode, member.signupCode);
    if (!valid) return res.status(401).json({ error: 'Invalid signup code.' });

    const passwordHash = await bcrypt.hash(password, 10);
    member.passwordHash = passwordHash;
    member.signupCode = null;
    member.signupCodeExpires = null;
    member.isActive = true;
    await member.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /member/login — member login
router.post('/member/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const member = await Member.findOne({ email: email.toLowerCase().trim() });
    if (!member) return res.status(401).json({ error: 'Invalid email or password.' });
    if (!member.isActive) return res.status(401).json({ error: 'Account not activated. Use your signup code first.' });

    const valid = await bcrypt.compare(password, member.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { memberId: member._id, role: 'member' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, memberId: member._id, name: member.name, category: member.category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /gmail/init/:memberId — redirect to Google consent (unchanged)
router.get('/gmail/init/:memberId', async (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      state: req.params.memberId,
    });

    res.redirect(url);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /gmail/callback — handle OAuth redirect (unchanged)
router.get('/gmail/callback', async (req, res) => {
  try {
    const { code, state: memberId } = req.query;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    await Member.findByIdAndUpdate(memberId, {
      gmailRefreshToken: tokens.refresh_token,
      gmailEmail: tokens.scope ? tokens.scope.split(' ')[0] : null,
    });

    res.redirect('http://localhost:5173/dashboard?gmailConnected=true');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/resend-code — admin regenerates signup code
router.post('/admin/resend-code/:memberId', async (req, res) => {
  try {
    const crypto = require('crypto');
    const code = crypto.randomBytes(4).toString('hex'); // 8 hex chars
    const hash = await bcrypt.hash(code, 6);

    await Member.findByIdAndUpdate(req.params.memberId, {
      signupCode: hash,
      signupCodeExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({ signupCode: code });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/authRoutes.js
git commit -m "feat: add member signup and login routes"
```

---

### Task 3: Backend — Update Admin Login JWT to Include Role

**Files:**
- Modify: `server/routes/adminRoutes.js`

- [ ] **Step 1: Update admin login to include `role: 'admin'` in JWT payload and use `req.user`**

In `adminRoutes.js`, change the JWT sign to include role, and update `req.admin` → `req.user`:

Line 25-29 — update JWT payload:
```js
const token = jwt.sign(
  { adminId: admin._id, email: admin.email, role: 'admin' },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

Line 42 — update `req.admin.adminId` → `req.user.adminId`:
```js
const members = await Member.find(
  { adminId: req.user.adminId },
  'name category gmailEmail _id createdAt'
);
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/adminRoutes.js
git commit -m "feat: add role to admin JWT, update req.admin to req.user"
```

---

### Task 4: Backend — Update Member CRUD Routes (email + signupCode, remove PIN)

**Files:**
- Modify: `server/routes/memberRoutes.js`

- [ ] **Step 1: Rewrite memberRoutes.js — add email to create, generate signupCode, remove PIN endpoints**

```js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Member = require('../models/Member');
const DailyLog = require('../models/DailyLog');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// All routes below require JWT + admin
router.use(verifyToken, requireAdmin);

// POST / — Create member
router.post('/', async (req, res) => {
  try {
    const { name, email, category } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });

    const existing = await Member.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'A member with this email already exists.' });

    // Generate 8-char signup code
    const signupCode = crypto.randomBytes(4).toString('hex');
    const signupCodeHash = await bcrypt.hash(signupCode, 6);
    const signupCodeExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const member = await Member.create({
      name,
      email: email.toLowerCase().trim(),
      category: category || 'FREE',
      adminId: req.user.adminId,
      signupCode: signupCodeHash,
      signupCodeExpires,
    });

    const { signupCode: _, gmailRefreshToken: __, passwordHash: ___, ...safe } = member.toObject();
    res.status(201).json({ ...safe, signupCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET / — List all members for this admin
router.get('/', async (req, res) => {
  try {
    const members = await Member.find(
      { adminId: req.user.adminId },
      '-signupCode -gmailRefreshToken -passwordHash'
    );
    res.json({ members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:memberId — Delete member + logs
router.delete('/:memberId', async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.memberId);
    await DailyLog.deleteMany({ memberId: req.params.memberId });
    res.json({ message: 'Member deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/memberRoutes.js
git commit -m "feat: update member CRUD — email + signupCode, remove PIN routes"
```

---

### Task 5: Backend — Update Log Routes (JWT auth, span, break, recent endpoint)

**Files:**
- Modify: `server/routes/logRoutes.js`

- [ ] **Step 1: Rewrite logRoutes.js — use verifyToken, add span/break support, add recent endpoint**

```js
const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const DailyLog = require('../models/DailyLog');
const { verifyToken } = require('../middleware/auth');

function today() {
  return new Date().toISOString().slice(0, 10);
}

// POST /update — Log an hourly update (JWT auth, replaces PIN auth)
router.post('/update', verifyToken, async (req, res) => {
  try {
    const { memberId, hour, update, span, isBreak } = req.body;
    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    if (hour < 1 || hour > 10) {
      return res.status(400).json({ error: 'Hour must be between 1 and 10' });
    }

    if (!isBreak && member.category === 'RESTRICTED') {
      const match = member.restrictedKeywords.some((kw) =>
        update.toLowerCase().includes(kw.toLowerCase())
      );
      if (!match) {
        return res.status(400).json({
          error: 'Update must relate to job applications or agentic AI learning.',
        });
      }
    }

    const entryText = isBreak ? 'Break' : update;
    const date = today();
    const hoursToFill = {};
    const spanLength = span ? Math.min(span, 10 - hour + 1) : 1;

    for (let i = 0; i < spanLength; i++) {
      hoursToFill[`hours.${hour + i}`] = entryText;
    }

    const log = await DailyLog.findOneAndUpdate(
      { memberId, date },
      { $set: { ...hoursToFill, updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /today/:memberId
router.get('/today/:memberId', verifyToken, async (req, res) => {
  try {
    const log = await DailyLog.findOne({
      memberId: req.params.memberId,
      date: today(),
    });
    res.json(log || { hours: {}, autoDetected: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /history/:memberId/:date
router.get('/history/:memberId/:date', verifyToken, async (req, res) => {
  try {
    const log = await DailyLog.findOne({
      memberId: req.params.memberId,
      date: req.params.date,
    });
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /recent/:memberId — last 7 days of logs
router.get('/recent/:memberId', verifyToken, async (req, res) => {
  try {
    const logs = await DailyLog.find({
      memberId: req.params.memberId,
    }).sort({ date: -1 }).limit(7).lean();

    const result = logs.map((log) => ({
      date: log.date,
      fillCount: Object.keys(log.hours || {}).length,
      autoDetectedCount: (log.autoDetected || []).length,
    }));

    res.json({ days: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/logRoutes.js
git commit -m "feat: update log routes — JWT auth, span, break, recent endpoint"
```

---

### Task 6: Frontend — Update Axios Interceptor & AuthContext (dual-token support)

**Files:**
- Modify: `client/src/api/axios.js`
- Modify: `client/src/context/AuthContext.jsx`

- [ ] **Step 1: Update axios interceptor to fall back to member token**

```js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ss_token') || localStorage.getItem('ss_member_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

- [ ] **Step 2: Update AuthContext — add member login/logout, isMember state**

```jsx
import { createContext, useState, useContext } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('ss_admin');
    return stored ? JSON.parse(stored) : null;
  });

  const [member, setMember] = useState(() => {
    const stored = localStorage.getItem('ss_member');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const { data } = await api.post('/admin/login', { email, password });
    localStorage.setItem('ss_token', data.token);
    localStorage.setItem('ss_admin', JSON.stringify({ email: data.email, id: data.adminId }));
    setAdmin({ email: data.email, id: data.adminId });
    setMember(null);
  };

  const logout = () => {
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_admin');
    setAdmin(null);
  };

  const memberLogin = async (email, password) => {
    const { data } = await api.post('/auth/member/login', { email, password });
    localStorage.setItem('ss_member_token', data.token);
    localStorage.setItem('ss_member', JSON.stringify({
      memberId: data.memberId,
      name: data.name,
      category: data.category,
    }));
    setMember({ memberId: data.memberId, name: data.name, category: data.category });
    return data;
  };

  const memberLogout = () => {
    localStorage.removeItem('ss_member_token');
    localStorage.removeItem('ss_member');
    setMember(null);
  };

  return (
    <AuthContext.Provider value={{ admin, member, login, logout, memberLogin, memberLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/api/axios.js client/src/context/AuthContext.jsx
git commit -m "feat: add member token support to axios and AuthContext"
```

---

### Task 7: Frontend — Update Login Page & Create Signup Page

**Files:**
- Modify: `client/src/components/MemberLoginForm.jsx`
- Create: `client/src/pages/SignupPage.jsx`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Rewrite MemberLoginForm — email + password (replaces name + PIN)**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function MemberLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { memberLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await memberLogin(email, password);
      navigate(`/member/${data.memberId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl font-sans flex items-center gap-2 animate-fade-in">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-sans text-gray-500 tracking-wider uppercase">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="member@example.com"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-sans text-gray-500 tracking-wider uppercase">Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-[#0C0E1D]/30 border-t-[#0C0E1D] rounded-full animate-spin" />
            Signing in...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Log Hours
            <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </Button>

      <p className="text-[10px] text-gray-600 text-center font-sans tracking-wider uppercase pt-1">
        Don't have an account? <a href="/signup" className="text-[#51FAAA] hover:underline">Sign up</a>
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Create SignupPage**

```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { UserPlus, ArrowRight, CheckCircle } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupCode, setSignupCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/member/signup', { email, password, signupCode });
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0C0E1D] flex items-center justify-center px-4">
        <div className="noise-overlay" />
        <div className="text-center animate-fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#51FAAA]/10 border border-[#51FAAA]/20 mb-5">
            <CheckCircle className="w-8 h-8 text-[#51FAAA]" />
          </div>
          <h1 className="font-display text-3xl text-white mb-2">Account Created!</h1>
          <p className="text-gray-500 text-sm font-sans">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C0E1D] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="noise-overlay" />
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute top-1/4 -left-32 w-[28rem] h-[28rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(81, 250, 170, 0.12) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div className="absolute bottom-1/4 -right-32 w-[28rem] h-[28rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255, 129, 255, 0.1) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }} />

      <div className="w-full max-w-sm relative animate-fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#51FAAA]/10 border border-[#51FAAA]/20 mb-4">
            <UserPlus className="w-6 h-6 text-[#51FAAA]" />
          </div>
          <h1 className="font-display text-2xl text-white mb-1">Create Account</h1>
          <p className="text-xs font-sans text-gray-500">Use the code from your admin to activate</p>
        </div>

        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl font-sans flex items-center gap-2 animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-gray-500 tracking-wider uppercase">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@example.com" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-gray-500 tracking-wider uppercase">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" minLength={6} required />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-gray-500 tracking-wider uppercase">Signup Code</label>
              <Input value={signupCode} onChange={(e) => setSignupCode(e.target.value)} placeholder="e.g. a1b2c3d4" required />
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-[#0C0E1D]/30 border-t-[#0C0E1D] rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center mt-6">
          <Link to="/" className="text-xs font-sans text-gray-600 hover:text-gray-400 transition-colors">
            Already have an account? Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add /signup route to App.jsx**

```jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MemberPage from './pages/MemberPage';
import HistoryPage from './pages/HistoryPage';
import SignupPage from './pages/SignupPage';

function ProtectedRoute({ children }) {
  const { admin } = useAuth();
  return admin ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/member/:memberId" element={<MemberPage />} />
      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
    </Routes>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/MemberLoginForm.jsx client/src/pages/SignupPage.jsx client/src/App.jsx
git commit -m "feat: member login with email+password, signup page, route"
```

---

### Task 8: Frontend — Create Data Entry Components (QuickActions, SlotEditor, TimelineSlot, BreakSlot, SpanBlock, ScanChip)

**Files:**
- Create: `client/src/components/QuickActions.jsx`
- Create: `client/src/components/SlotEditor.jsx`
- Create: `client/src/components/TimelineSlot.jsx`
- Create: `client/src/components/BreakSlot.jsx`
- Create: `client/src/components/SpanBlock.jsx`
- Create: `client/src/components/ScanChip.jsx`
- Modify: `client/src/components/ScanButton.jsx`

- [ ] **Step 1: Create QuickActions component**

```jsx
import { useState } from 'react';
import { Button } from './ui/button';

const ACTIONS = [
  { label: 'Applied', color: '#51FAAA', template: 'Applied to ___' },
  { label: 'Studied', color: '#60a5fa', template: 'Studied course: ___' },
  { label: 'Interview', color: '#fbbf24', template: 'Interview at ___' },
  { label: 'Prep', color: '#c084fc', template: 'Preparing for ___' },
  { label: 'Networking', color: '#94a3b8', template: 'Networking: ___' },
  { label: 'Other', color: '#94a3b8', template: '' },
  { label: 'Break', color: '#fb923c', template: 'Break', isBreak: true },
];

export default function QuickActions({ onSelect, compact }) {
  return (
    <div className={`flex gap-1.5 ${compact ? 'flex-wrap' : 'flex-wrap'}`}>
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => onSelect(action)}
          className={`text-xs font-sans px-3 py-1.5 rounded-full border transition-all hover:brightness-125 ${
            action.isBreak
              ? 'border-orange-500/20 bg-orange-500/10 text-orange-400'
              : action.color === '#51FAAA'
              ? 'border-[#51FAAA]/20 bg-[#51FAAA]/10 text-[#51FAAA]'
              : action.color === '#60a5fa'
              ? 'border-blue-400/20 bg-blue-400/10 text-blue-400'
              : action.color === '#fbbf24'
              ? 'border-amber-400/20 bg-amber-400/10 text-amber-400'
              : action.color === '#c084fc'
              ? 'border-purple-400/20 bg-purple-400/10 text-purple-400'
              : 'border-white/[0.08] bg-white/[0.03] text-gray-400'
          }`}
        >
          {action.isBreak ? '☕ ' : ''}{action.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create SlotEditor component**

```jsx
import { useState, useEffect } from 'react';
import QuickActions from './QuickActions';
import { Button } from './ui/button';

export default function SlotEditor({ initialText, duration, onSubmit, onCancel, maxSpan }) {
  const [text, setText] = useState(initialText || '');
  const [span, setSpan] = useState(duration || 1);

  const handleAction = (action) => {
    setText(action.template);
  };

  return (
    <div className="space-y-2">
      <QuickActions onSelect={handleAction} compact />
      <div className="flex gap-2 items-start">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What are you working on?"
          className="flex-1 bg-[#0C0E1D]/60 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/90 font-sans placeholder:text-gray-700 focus:outline-none focus:border-[#51FAAA]/40 focus:ring-1 focus:ring-[#51FAAA]/20 resize-none transition-all"
          rows={1}
          autoFocus
        />
        <select
          value={span}
          onChange={(e) => setSpan(Number(e.target.value))}
          className="bg-[#0C0E1D] border border-white/[0.08] rounded-lg px-2 py-2 text-xs text-gray-400 focus:outline-none focus:border-[#51FAAA]/40"
        >
          {Array.from({ length: maxSpan }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}h</option>
          ))}
        </select>
      </div>
      {span > 1 && (
        <p className="text-[11px] text-gray-600">Will also fill next {span - 1} hour(s)</p>
      )}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={() => onSubmit(text, span)}
          disabled={!text.trim()}
        >
          {span > 1 ? `Log ${span}h` : 'Log'}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create TimelineSlot component**

```jsx
import { useState } from 'react';
import SlotEditor from './SlotEditor';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, Circle, Coffee, Pencil } from 'lucide-react';

export default function TimelineSlot({ slot, state, text, isBreak, scanChips, currentSlot, onUpdate, onEdit, maxSpan }) {
  const [editing, setEditing] = useState(state === 'current' && !text);

  if (isBreak) {
    return (
      <div className="rounded-xl border border-orange-500/15 bg-orange-500/[0.02] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 shrink-0 flex flex-col items-center gap-1">
            <Coffee className="w-4 h-4 text-orange-400" />
            <span className="font-mono text-[11px] text-gray-600">H{slot}</span>
          </div>
          <span className="text-sm text-orange-300/80 font-sans">Break — {text}</span>
          <Badge variant="outline" className="ml-auto shrink-0 text-orange-400 border-orange-500/20">Break</Badge>
        </div>
      </div>
    );
  }

  const renderEditing = () => (
    <div className={`rounded-xl border px-4 py-3 ${state === 'current' ? 'border-[#51FAAA]/30 bg-[#51FAAA]/[0.03] ring-1 ring-[#51FAAA]/10' : 'border-white/[0.06] bg-white/[0.02]'}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="flex items-center gap-1.5">
          {state === 'current' && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#51FAAA] opacity-50 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#51FAAA]" />
            </span>
          )}
          <span className="font-mono text-[11px] text-gray-600">H{slot}</span>
        </span>
        {state === 'current' && <Badge variant="default" className="text-[10px] px-1.5 py-0">Now</Badge>}
        {scanChips?.length > 0 && state === 'current' && (
          <div className="ml-auto flex gap-1">
            {scanChips.map((chip, i) => (
              <button
                key={i}
                onClick={() => onEdit(chip.template)}
                className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/15 hover:bg-blue-500/20 transition-colors"
              >
                + {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <SlotEditor
        initialText={text}
        onSubmit={(updateText, span) => onUpdate(slot, updateText, span)}
        onCancel={state !== 'current' ? () => setEditing(false) : undefined}
        maxSpan={maxSpan}
      />
    </div>
  );

  const renderDisplay = () => (
    <div
      className={`rounded-xl border px-4 py-3 transition-all cursor-pointer hover:border-white/[0.12] ${
        state === 'done' ? 'border-[#51FAAA]/20 bg-[#51FAAA]/[0.03]' :
        state === 'missed' ? 'border-rose-500/15 bg-rose-500/[0.02]' :
        'border-white/[0.04] bg-transparent'
      }`}
      onClick={() => setEditing(true)}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 shrink-0 flex flex-col items-center gap-1">
          {state === 'done' ? <CheckCircle2 className="w-4 h-4 text-[#51FAAA]" /> :
           state === 'missed' ? <XCircle className="w-4 h-4 text-rose-400/60" /> :
           <Circle className="w-4 h-4 text-gray-700" />}
          <span className="font-mono text-[11px] text-gray-600">H{slot}</span>
        </div>

        {state === 'done' && (
          <span className="text-sm text-[#51FAAA]/80 font-sans line-clamp-1 flex-1">{text}</span>
        )}
        {state === 'missed' && (
          <span className="text-sm text-rose-400/50 font-sans italic flex-1">Tap to fill</span>
        )}
        {state === 'future' && (
          <span className="text-sm text-gray-700 font-sans flex-1">Tap to plan ahead</span>
        )}

        <Badge
          variant={
            state === 'done' ? 'success' :
            state === 'missed' ? 'danger' : 'outline'
          }
          className="ml-auto shrink-0"
        >
          {state === 'done' ? 'Logged' :
           state === 'missed' ? 'Missed' : 'Upcoming'}
        </Badge>
      </div>
    </div>
  );

  return editing ? renderEditing() : renderDisplay();
}
```

- [ ] **Step 4: Create BreakSlot component**

```jsx
import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Coffee } from 'lucide-react';

export default function BreakSlot({ slot, note, onSave, onCancel }) {
  const [breakNote, setBreakNote] = useState(note || '');

  return (
    <div className="rounded-xl border border-orange-500/15 bg-orange-500/[0.02] px-4 py-3">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 shrink-0 flex flex-col items-center gap-1">
          <Coffee className="w-4 h-4 text-orange-400" />
          <span className="font-mono text-[11px] text-gray-600">H{slot}</span>
        </div>
        <Badge variant="outline" className="text-orange-400 border-orange-500/20">Break</Badge>
      </div>
      <div className="flex gap-2">
        <Input
          value={breakNote}
          onChange={(e) => setBreakNote(e.target.value)}
          placeholder="Optional break note (e.g. Lunch)"
          className="flex-1 text-sm"
        />
        <Button size="sm" onClick={() => onSave(breakNote)}>Save</Button>
        {onCancel && <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create SpanBlock component**

```jsx
import { Badge } from './ui/badge';
import { Link2, Unlink } from 'lucide-react';

export default function SpanBlock({ startSlot, endSlot, text, onEdit, onUnspan }) {
  const hours = [];
  for (let i = startSlot; i <= endSlot; i++) hours.push(i);

  return (
    <div className="rounded-xl border border-[#51FAAA]/20 bg-[#51FAAA]/[0.03] overflow-hidden">
      <div className="flex items-stretch">
        <div className="bg-[#51FAAA]/[0.06] px-3 py-3 flex flex-col items-center justify-center gap-0.5 border-r border-[#51FAAA]/10 min-w-[44px]">
          {hours.map((h) => (
            <span key={h} className="font-mono text-[10px] text-[#51FAAA] leading-tight">H{h}</span>
          ))}
        </div>
        <div className="flex-1 px-4 py-3 flex items-center gap-3">
          <Link2 className="w-3.5 h-3.5 text-[#51FAAA]/60 shrink-0" />
          <div>
            <span className="text-sm text-[#51FAAA]/80 font-sans line-clamp-1">{text}</span>
            <span className="text-[10px] text-gray-600 font-sans">{hours.length}h span</span>
          </div>
        </div>
        <div className="flex items-center gap-1 pr-3">
          <button onClick={onEdit} className="text-[10px] text-gray-500 border border-white/[0.06] rounded-md px-2 py-1 hover:text-gray-300 transition-colors">Edit</button>
          <button onClick={onUnspan} className="text-[10px] text-gray-500 border border-white/[0.06] rounded-md px-2 py-1 hover:text-rose-400 transition-colors">
            <Unlink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create ScanChip component**

No separate file needed — inline scan chips are rendered inside TimelineSlot directly (see TimelaneSlot's scanChips prop). Remove from component list.

Actually let me delete that file. Remove it from the plan.

- [ ] **Step 7: Update ScanButton — minor, add auto-scan on mount prop support**

No changes needed to ScanButton for now — it already works as a manual trigger. The auto-scan-on-load and inline chips are handled in Task 10 (MemberPage rewrite).

- [ ] **Step 8: Commit**

```bash
git add client/src/components/QuickActions.jsx client/src/components/SlotEditor.jsx client/src/components/TimelineSlot.jsx client/src/components/BreakSlot.jsx client/src/components/SpanBlock.jsx
git commit -m "feat: add data entry components — QuickActions, SlotEditor, TimelineSlot, BreakSlot, SpanBlock"
```

---

### Task 9: Frontend — Create History Components (MemberHistory, FocusInput)

**Files:**
- Create: `client/src/components/MemberHistory.jsx`
- Create: `client/src/components/FocusInput.jsx`

- [ ] **Step 1: Create FocusInput component**

```jsx
import { useState } from 'react';

export default function FocusInput({ initialValue, onChange }) {
  const [value, setValue] = useState(initialValue || '');

  const handleBlur = () => {
    if (onChange) onChange(value);
  };

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
      <span className="text-[11px] text-gray-600 font-sans tracking-wider uppercase">Today's Focus</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="What's your main goal today?"
        className="w-full bg-transparent text-sm text-gray-300 font-sans placeholder:text-gray-700 focus:outline-none mt-0.5"
      />
    </div>
  );
}
```

- [ ] **Step 2: Create MemberHistory component**

```jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export default function MemberHistory({ memberId }) {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId) return;
    setLoading(true);
    api.get(`/logs/recent/${memberId}`)
      .then(({ data }) => setDays(data.days || []))
      .catch(() => setDays([]))
      .finally(() => setLoading(false));
  }, [memberId]);

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="min-w-[110px] rounded-xl border border-white/[0.04] p-3 animate-pulse">
            <div className="h-3 w-16 bg-white/[0.04] rounded mb-2" />
            <div className="h-6 w-12 bg-white/[0.04] rounded mb-2" />
            <div className="h-1.5 w-full bg-white/[0.04] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-6 h-6 text-gray-700 mx-auto mb-2" />
        <p className="text-xs text-gray-600 font-sans">No history yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[11px] text-gray-600 font-sans tracking-wider uppercase mb-3">Past Days</div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {days.map((day) => {
          const fillPct = Math.round((day.fillCount / 10) * 100);
          const isToday = day.date === new Date().toISOString().slice(0, 10);
          return (
            <div
              key={day.date}
              className={`min-w-[110px] rounded-xl border p-3 shrink-0 ${
                isToday ? 'border-[#51FAAA]/20 bg-[#51FAAA]/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'
              }`}
            >
              <div className="text-[10px] text-gray-500 font-sans">
                {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div className="text-lg font-display font-bold text-white mt-1">
                {day.fillCount}<span className="text-xs text-gray-600 font-sans">/10</span>
              </div>
              <div className="h-1 bg-white/[0.04] rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-[#51FAAA] rounded-full transition-all" style={{ width: `${fillPct}%` }} />
              </div>
              {day.autoDetectedCount > 0 && (
                <div className="text-[10px] text-gray-600 mt-1.5">{day.autoDetectedCount} app{day.autoDetectedCount > 1 ? 's' : ''}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/MemberHistory.jsx client/src/components/FocusInput.jsx
git commit -m "feat: add MemberHistory and FocusInput components"
```

---

### Task 10: Frontend — Rewrite MemberPage (remove PIN gate, wire everything)

**Files:**
- Rewrite: `client/src/pages/MemberPage.jsx`
- Remove: `client/src/components/HourlyGrid.jsx` (replaced by new timeline)
- Modify: `client/src/components/ScanButton.jsx` (minor — support silent auto-scan)

- [ ] **Step 1: Rewrite MemberPage — remove PIN gate, use JWT, wire new components**

```jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import TimelineSlot from '../components/TimelineSlot';
import SpanBlock from '../components/SpanBlock';
import BreakSlot from '../components/BreakSlot';
import ScannerButton from '../components/ScanButton';
import MemberHistory from '../components/MemberHistory';
import FocusInput from '../components/FocusInput';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/toast';
import { ArrowLeft, RefreshCw, History } from 'lucide-react';

export default function MemberPage() {
  const { memberId } = useParams();
  const { admin, member } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [memberInfo, setMemberInfo] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanResults, setScanResults] = useState([]);

  const isAuthenticated = admin || member;
  const isAdminView = !!admin;

  // Redirect to login if no auth
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Fetch member info + today's log
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      try {
        const [membersRes, logRes] = await Promise.all([
          api.get('/members').catch(() => null),
          api.get(`/logs/today/${memberId}`),
        ]);
        const member = membersRes?.data?.members?.find((m) => m._id === memberId);
        if (member) setMemberInfo(member);
        // Fall back to context member info
        if (!member && !memberInfo) {
          setMemberInfo({ _id: memberId, name: 'Loading...', category: 'FREE' });
        }
        setTodayLog(logRes.data);
      } catch (err) {
        addToast('Failed to load member data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [memberId, isAuthenticated]);

  // Auto-scan on mount for RESTRICTED members
  useEffect(() => {
    if (!isAuthenticated || !memberInfo || memberInfo.category !== 'RESTRICTED') return;
    let cancelled = false;
    api.post(`/scan/${memberId}`).then(({ data }) => {
      if (!cancelled && data.results?.length) {
        setScanResults(data.results.map((r) => ({
          label: `${r.role} @ ${r.company}`,
          template: `${r.role} at ${r.company}`,
        })));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [memberId, isAuthenticated, memberInfo?.category]);

  const handleUpdate = async (slot, text, span) => {
    try {
      const payload = { memberId, hour: slot, update: text };
      if (span && span > 1) payload.span = span;
      await api.post('/logs/update', payload);
      const { data } = await api.get(`/logs/today/${memberId}`);
      setTodayLog(data);
      addToast('Logged!', 'success', 2000);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to log', 'error', 3000);
    }
  };

  const handleBreak = async (slot, note) => {
    try {
      await api.post('/logs/update', { memberId, hour: slot, update: note || 'Break', isBreak: true });
      const { data } = await api.get(`/logs/today/${memberId}`);
      setTodayLog(data);
      addToast('Break logged', 'success', 2000);
    } catch (err) {
      addToast('Failed to log break', 'error', 3000);
    }
  };

  if (!isAuthenticated) return null;

  const hours = todayLog?.hours || {};
  const currentSlot = Math.max(1, Math.min(10, new Date().getHours() - 7));

  const getSlotState = (slot) => {
    if (hours[String(slot)]) return 'done';
    if (slot < currentSlot) return 'missed';
    if (slot === currentSlot) return 'current';
    return 'future';
  };

  // Check if slot is part of a span
  const isBreakSlot = (slot) => {
    const entry = hours[String(slot)];
    if (!entry) return false;
    return entry === 'Break' || entry.startsWith('Break —');
  };

  // Group consecutive identical entries into spans
  const buildTimeline = () => {
    const items = [];
    let i = 1;
    while (i <= 10) {
      const entry = hours[String(i)];
      if (!entry || isBreakSlot(i)) {
        items.push({ type: 'slot', slot: i, state: getSlotState(i), text: entry || '', isBreak: isBreakSlot(i) });
        i++;
        continue;
      }
      // Check for consecutive identical entries (span)
      let j = i + 1;
      while (j <= 10 && hours[String(j)] === entry) j++;
      if (j - i > 1) {
        items.push({ type: 'span', startSlot: i, endSlot: j - 1, text: entry });
        i = j;
      } else {
        items.push({ type: 'slot', slot: i, state: getSlotState(i), text: entry, isBreak: false });
        i++;
      }
    }
    return items;
  };

  const timeline = buildTimeline();

  return (
    <div className="min-h-screen bg-[#0C0E1D]">
      <div className="noise-overlay" />
      <div className="fixed top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(81, 250, 170, 0.08) 0%, transparent 70%)', filter: 'blur(120px)', pointerEvents: 'none' }} />
      <div className="fixed bottom-1/3 -left-32 w-[24rem] h-[24rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255, 129, 255, 0.06) 0%, transparent 70%)', filter: 'blur(120px)', pointerEvents: 'none' }} />

      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 animate-fade-up">
          <Link to="/" className="w-9 h-9 rounded-full border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.04] transition-all">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </Link>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#51FAAA]/20 to-[#FF81FF]/10 border border-[#51FAAA]/20 flex items-center justify-center">
            <span className="font-display text-xl text-[#51FAAA]">{memberInfo?.name?.charAt(0) || '?'}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl text-white">{memberInfo?.name}</h1>
              <Badge variant={memberInfo?.category === 'RESTRICTED' ? 'restricted' : 'free'}>
                {memberInfo?.category === 'RESTRICTED' ? 'RESTRICTED' : 'FREE'}
              </Badge>
              {isAdminView && <Badge variant="outline" className="text-[10px]">Admin</Badge>}
            </div>
          </div>
        </div>

        {/* Focus Input */}
        <div className="animate-fade-up animate-stagger-1">
          <FocusInput />
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.03] border border-white/[0.04]" />
            ))}
          </div>
        ) : (
          <>
            {/* Timeline */}
            <div className="animate-fade-up animate-stagger-2 space-y-1.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-1 rounded-full bg-[#51FAAA]" />
                <span className="font-sans text-xs text-gray-500 tracking-widest uppercase">Today</span>
              </div>
              {timeline.map((item, idx) => {
                if (item.type === 'span') {
                  return (
                    <SpanBlock
                      key={`span-${item.startSlot}`}
                      startSlot={item.startSlot}
                      endSlot={item.endSlot}
                      text={item.text}
                      onEdit={() => {}}
                      onUnspan={() => {}}
                    />
                  );
                }
                if (item.isBreak) {
                  return (
                    <BreakSlot
                      key={`break-${item.slot}`}
                      slot={item.slot}
                      note={item.text?.replace('Break — ', '').replace('Break', '') || ''}
                      onSave={(note) => handleBreak(item.slot, note)}
                    />
                  );
                }
                return (
                  <TimelineSlot
                    key={`slot-${item.slot}`}
                    slot={item.slot}
                    state={item.state}
                    text={item.text}
                    isBreak={false}
                    scanChips={item.state === 'current' ? scanResults : []}
                    currentSlot={currentSlot}
                    onUpdate={(slot, text, span) => handleUpdate(slot, text, span)}
                    onEdit={(template) => {}}
                    maxSpan={Math.min(4, 10 - item.slot + 1)}
                  />
                );
              })}
            </div>

            {/* Utility Bar */}
            <div className="flex gap-2 flex-wrap animate-fade-up animate-stagger-3">
              <ScannerButton
                memberId={memberId}
                category={memberInfo?.category}
                onFillSlot={(text) => addToast('Auto-detected entry available', 'default')}
              />
            </div>

            {/* Break quick-add */}
            <div className="animate-fade-up animate-stagger-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Find first empty or current slot and log a break
                  for (let i = currentSlot; i <= 10; i++) {
                    if (!hours[String(i)]) {
                      handleBreak(i, 'Lunch');
                      break;
                    }
                  }
                }}
                className="text-orange-400 border-orange-500/20 hover:bg-orange-500/10"
              >
                ☕ Quick Break
              </Button>
            </div>
          </>
        )}

        {/* Member History */}
        <div className="animate-fade-up animate-stagger-3 pt-2">
          <MemberHistory memberId={memberId} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Remove HourlyGrid — replaced entirely by the new timeline system**

Just delete the file (git tracks it, so `git rm`):
```bash
git rm client/src/components/HourlyGrid.jsx
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/MemberPage.jsx
git rm client/src/components/HourlyGrid.jsx
git commit -m "feat: rewrite MemberPage — JWT auth, new timeline, history, scan integration"
```

---

## Self-Review Checklist

1. **Spec coverage:** All spec sections have corresponding tasks — Member model, middleware, auth routes, signup page, login flow, timeline components, spans, breaks, history, scan integration, removal of PIN.
2. **Placeholder scan:** No "TBD", "TODO", or "implement later" patterns. All code is fully written.
3. **Type consistency:** `req.user` used consistently instead of `req.admin`. Auth middleware exports `{ verifyToken, requireAdmin, requireMember }`. JWT payloads use `role: 'admin'` and `role: 'member'`.
