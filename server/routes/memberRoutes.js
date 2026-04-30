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
