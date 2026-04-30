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
