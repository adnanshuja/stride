const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Member = require('../models/Member');
const DailyLog = require('../models/DailyLog');
const JobApplication = require('../models/JobApplication');
const Course = require('../models/Course');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// POST /login — bootstrap only when no admin exists at all
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminExists = await Admin.countDocuments();
    let admin = await Admin.findOne({ email });

    if (!admin) {
      if (adminExists > 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      // First ever admin — bootstrap with initial signup code
      const passwordHash = await bcrypt.hash(password, 10);
      admin = await Admin.create({ email, passwordHash });
      await admin.generateSignupCode();
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

// GET /dashboard — all members with today's log (admin only)
router.get('/dashboard', verifyToken, requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const members = await Member.find(
      { adminId: req.user.adminId },
      'name category gmailEmail _id createdAt'
    );

    const memberIds = members.map((m) => m._id);

    const membersWithLogs = await Promise.all(
      members.map(async (member) => {
        const todayLog = await DailyLog.findOne({
          memberId: member._id,
          date: today,
        });
        return { ...member.toObject(), todayLog: todayLog || null };
      })
    );

    // Aggregate course stats
    const courses = await Course.find({ memberId: { $in: memberIds } }).lean();
    const courseStatsMap = {};
    courses.forEach((c) => {
      const mid = c.memberId.toString();
      if (!courseStatsMap[mid]) {
        courseStatsMap[mid] = { totalCourses: 0, totalTopics: 0, completedTopics: 0, totalCourseMinutes: 0 };
      }
      courseStatsMap[mid].totalCourses++;
      courseStatsMap[mid].totalTopics += c.totalTopics || 0;
      courseStatsMap[mid].completedTopics += c.completedTopics || 0;
      courseStatsMap[mid].totalCourseMinutes += c.totalCourseMinutes || 0;
    });

    const membersWithStats = membersWithLogs.map((m) => ({
      ...m,
      courseStats: courseStatsMap[m._id.toString()] || null,
    }));

    res.json({ members: membersWithStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /dashboard/weekly — last 7 days aggregation (admin only)
router.get('/dashboard/weekly', verifyToken, requireAdmin, async (req, res) => {
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

// GET /dashboard/jobs — aggregated job application stats (admin only)
router.get('/dashboard/jobs', verifyToken, requireAdmin, async (req, res) => {
  try {
    const members = await Member.find({ adminId: req.user.adminId }, '_id name');
    const memberIds = members.map((m) => m._id);

    const jobs = await JobApplication.find({ memberId: { $in: memberIds } }).lean();

    const byStatus = { applied: 0, interviewed: 0, rejected: 0, offered: 0 };
    const bySource = { linkedin: 0, gmail: 0, direct: 0, link: 0 };
    const perMemberMap = {};

    members.forEach((m) => {
      perMemberMap[m._id.toString()] = {
        _id: m._id, name: m.name, total: 0, applied: 0, interviewed: 0, rejected: 0, offered: 0,
      };
    });

    jobs.forEach((job) => {
      if (byStatus[job.status] !== undefined) byStatus[job.status]++;
      if (bySource[job.source] !== undefined) bySource[job.source]++;

      const mid = job.memberId.toString();
      if (perMemberMap[mid]) {
        perMemberMap[mid].total++;
        perMemberMap[mid][job.status]++;
      }
    });

    // 7-day weekly trend
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      weeklyTrend.push({ date: dateStr, count: jobs.filter((j) => j.date === dateStr).length });
    }

    // This week (Mon–today)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const thisWeek = jobs.filter((j) => j.date >= weekStart.toISOString().slice(0, 10)).length;

    res.json({
      totalApplications: jobs.length,
      thisWeek,
      byStatus,
      bySource,
      weeklyTrend,
      perMember: Object.values(perMemberMap),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /activity/:memberId — date-ranged activity entries (admin only)
router.get('/activity/:memberId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { memberId } = req.params;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end query params required (YYYY-MM-DD)' });
    }
    if (start > end) {
      return res.status(400).json({ error: 'start date must be before end date' });
    }

    const member = await Member.findOne({ _id: memberId, adminId: req.user.adminId });
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const logs = await DailyLog.find({
      memberId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 }).lean();

    let totalEntries = 0;
    let totalTrackedMinutes = 0;
    logs.forEach((log) => {
      const entryCount = Object.keys(log.hours || {}).filter((k) => log.hours[k] && !log.hours[k].startsWith('Break')).length;
      totalEntries += entryCount;
      if (log.entryDurations) {
        Object.values(log.entryDurations).forEach((mins) => {
          totalTrackedMinutes += mins || 0;
        });
      }
    });

    res.json({
      logs,
      summary: {
        daysActive: logs.length,
        totalEntries,
        totalTrackedMinutes,
        startDate: start,
        endDate: end,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /signup-code — Get current shared signup code (auto-generates if missing)
router.get('/signup-code', verifyToken, requireAdmin, async (req, res) => {
  try {
    let admin = await Admin.findById(req.user.adminId);
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });
    if (!admin.signupCodeDisplay) {
      await admin.generateSignupCode();
    }
    res.json({
      signupCode: admin.signupCodeDisplay,
      expiresAt: admin.signupCodeExpires,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /signup-code/regenerate — Regenerate shared signup code
router.post('/signup-code/regenerate', verifyToken, requireAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.adminId);
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });
    const code = await admin.generateSignupCode();
    res.json({ signupCode: code, expiresAt: admin.signupCodeExpires });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
