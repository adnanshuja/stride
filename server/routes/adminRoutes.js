const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Member = require('../models/Member');
const DailyLog = require('../models/DailyLog');
const { verifyToken } = require('../middleware/auth');

// POST /login — bootstrap: first login creates admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let admin = await Admin.findOne({ email });

    if (!admin) {
      // First run — create admin
      const passwordHash = await bcrypt.hash(password, 10);
      admin = await Admin.create({ email, passwordHash });
    } else {
      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { adminId: admin._id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, adminId: admin._id, email: admin.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /dashboard — all members with today's log (protected)
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const members = await Member.find(
      { adminId: req.user.adminId },
      'name category gmailEmail _id createdAt'
    );

    const membersWithLogs = await Promise.all(
      members.map(async (member) => {
        const todayLog = await DailyLog.findOne({
          memberId: member._id,
          date: today,
        });
        return { ...member.toObject(), todayLog: todayLog || null };
      })
    );

    res.json({ members: membersWithLogs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /dashboard/weekly — last 7 days aggregation (protected)
router.get('/dashboard/weekly', verifyToken, async (req, res) => {
  try {
    const members = await Member.find({ adminId: req.user.adminId }, '_id');
    const memberIds = members.map((m) => m._id);

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);

      const logs = await DailyLog.find({ memberId: { $in: memberIds }, date: dateStr }).lean();
      const totalHours = logs.reduce((sum, log) => sum + Object.keys(log.hours || {}).length, 0);

      days.push({ date: dateStr, totalHours, memberCount: logs.length });
    }

    res.json({ days });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
