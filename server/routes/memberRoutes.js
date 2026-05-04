const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const DailyLog = require('../models/DailyLog');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET /:memberId — Get single member (admin or the member themselves)
router.get('/:memberId', verifyToken, async (req, res) => {
  try {
    const member = await Member.findById(req.params.memberId, '-gmailRefreshToken -passwordHash');
    if (!member) return res.status(404).json({ error: 'Member not found' });
    // Allow if admin, or if the member is requesting their own data
    if (req.user.role !== 'admin' && req.user.memberId !== req.params.memberId) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// All routes below require JWT + admin
router.use(verifyToken, requireAdmin);

// POST / — Create member
router.post('/', async (req, res) => {
  try {
    const { name, email, category } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });

    const existing = await Member.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'A member with this email already exists.' });

    const member = await Member.create({
      name,
      email: email.toLowerCase().trim(),
      category: category || 'FREE',
      adminId: req.user.adminId,
    });

    const { gmailRefreshToken: _, passwordHash: __, ...safe } = member.toObject();
    res.status(201).json({ ...safe });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET / — List all members for this admin
router.get('/', async (req, res) => {
  try {
    const members = await Member.find(
      { adminId: req.user.adminId },
      '-gmailRefreshToken -passwordHash'
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
