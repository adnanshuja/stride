const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Member = require('../models/Member');
const DailyLog = require('../models/DailyLog');

function today() {
  return new Date().toISOString().slice(0, 10);
}

// POST /update — Log an hourly update
router.post('/update', async (req, res) => {
  try {
    const { memberId, pin, hour, update } = req.body;

    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const valid = await bcrypt.compare(pin, member.pin);
    if (!valid) return res.status(401).json({ error: 'Invalid PIN' });

    if (hour < 1 || hour > 10) {
      return res.status(400).json({ error: 'Hour must be between 1 and 10' });
    }

    if (member.category === 'RESTRICTED') {
      const match = member.restrictedKeywords.some((kw) =>
        update.toLowerCase().includes(kw.toLowerCase())
      );
      if (!match) {
        return res.status(400).json({
          error: 'Update must relate to job applications or agentic AI learning.',
        });
      }
    }

    const log = await DailyLog.findOneAndUpdate(
      { memberId, date: today() },
      { $set: { [`hours.${hour}`]: update }, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /today/:memberId
router.get('/today/:memberId', async (req, res) => {
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
router.get('/history/:memberId/:date', async (req, res) => {
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

module.exports = router;
