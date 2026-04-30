const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const { google } = require('googleapis');
const Member = require('../models/Member');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET /gmail/init/:memberId — redirect to Google consent
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

// GET /gmail/callback — handle OAuth redirect
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

// POST /member/signup — Complete registration with signup code
router.post('/member/signup', async (req, res) => {
  try {
    const { email, password, signupCode } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

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

// POST /member/login — Member login
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

// POST /admin/resend-code/:memberId — Admin regenerates signup code
router.post('/admin/resend-code/:memberId', verifyToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.memberId)) {
      return res.status(400).json({ error: 'Invalid member ID.' });
    }

    const code = crypto.randomBytes(4).toString('hex');
    const hash = await bcrypt.hash(code, 6);

    const member = await Member.findByIdAndUpdate(req.params.memberId, {
      signupCode: hash,
      signupCodeExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }, { new: true });

    if (!member) return res.status(404).json({ error: 'Member not found.' });

    res.json({ signupCode: code });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
