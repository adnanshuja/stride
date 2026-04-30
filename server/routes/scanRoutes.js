const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const DailyLog = require('../models/DailyLog');
const { verifyToken } = require('../middleware/auth');
const gmailScanner = require('../services/gmailScanner');
const linkedinScanner = require('../services/linkedinScanner');

// POST /:memberId — trigger Gmail + LinkedIn scan
router.post('/:memberId', verifyToken, async (req, res) => {
  try {
    const member = await Member.findById(req.params.memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    if (member.category !== 'RESTRICTED') {
      return res.status(400).json({ error: 'Only RESTRICTED members can scan' });
    }

    if (!member.gmailRefreshToken) {
      return res.status(400).json({ error: 'Gmail not connected', needsAuth: true });
    }

    const today = new Date().toISOString().slice(0, 10);

    const [gmailResults, linkedinResults] = await Promise.all([
      gmailScanner.scanSentFolder(member.gmailRefreshToken, today),
      linkedinScanner.scanLinkedInEmails(member.gmailRefreshToken, today),
    ]);

    const allResults = [...gmailResults, ...linkedinResults];
    const seen = new Set();
    const deduped = allResults.filter((r) => {
      if (seen.has(r.rawSubject)) return false;
      seen.add(r.rawSubject);
      return true;
    });

    if (deduped.length > 0) {
      await DailyLog.findOneAndUpdate(
        { memberId: member._id, date: today },
        { $push: { autoDetected: { $each: deduped } } },
        { upsert: true }
      );
    }

    res.json({ results: deduped, count: deduped.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
