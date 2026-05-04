const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const DailyLog = require('../models/DailyLog');
const { verifyToken, requireMember } = require('../middleware/auth');

function today() {
  return new Date().toISOString().slice(0, 10);
}

// POST /update — Log an hourly update (member role only)
router.post('/update', verifyToken, requireMember, async (req, res) => {
  try {
    const { memberId, hour, update, span, isBreak, courseId, duration } = req.body;
    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const date = today();

    let log = await DailyLog.findOne({ memberId, date });
    const breakCount = log?.breakCount || 0;
    const maxSlots = 10 + breakCount;

    if (hour < 1 || hour > maxSlots) {
      return res.status(400).json({ error: `Hour must be between 1 and ${maxSlots}` });
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

    const entryText = isBreak ? (update ? `Break — ${update}` : 'Break') : update;
    const hoursToFill = {};
    const spanLength = span ? Math.min(span, maxSlots - hour + 1) : 1;

    for (let i = 0; i < spanLength; i++) {
      hoursToFill[`hours.${hour + i}`] = entryText;
      if (courseId) {
        hoursToFill[`courseHours.${hour + i}`] = courseId;
      }
    }

    if (duration) {
      hoursToFill[`entryDurations.${hour}`] = duration;
    }

    log = await DailyLog.findOneAndUpdate(
      { memberId, date },
      { $set: { ...hoursToFill, updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /start-day — Mark today as started (member role only)
router.post('/start-day', verifyToken, requireMember, async (req, res) => {
  try {
    const { memberId } = req.body;
    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const date = today();

    let log = await DailyLog.findOne({ memberId, date });
    if (log && log.startedAt) {
      return res.status(400).json({ error: 'Day already started' });
    }

    // Format current time as HH:mm
    const now = new Date();
    const startedAt = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    log = await DailyLog.findOneAndUpdate(
      { memberId, date },
      { $set: { startedAt, updatedAt: new Date() } },
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
