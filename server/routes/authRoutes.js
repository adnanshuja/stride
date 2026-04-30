const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const Member = require('../models/Member');

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

module.exports = router;
