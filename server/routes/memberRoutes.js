const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Member = require('../models/Member');
const DailyLog = require('../models/DailyLog');
const { verifyToken } = require('../middleware/auth');

// All routes protected
router.use(verifyToken);

// POST / — Create member
router.post('/', async (req, res) => {
  try {
    const { name, category, pin } = req.body;
    const pinHash = await bcrypt.hash(pin, 10);
    const member = await Member.create({
      name,
      category,
      pin: pinHash,
      adminId: req.admin.adminId,
    });
    const { pin: _, gmailRefreshToken: __, ...safe } = member.toObject();
    res.status(201).json(safe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET / — List all members for this admin
router.get('/', async (req, res) => {
  try {
    const members = await Member.find(
      { adminId: req.admin.adminId },
      '-pin -gmailRefreshToken'
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

// POST /:memberId/verify-pin
router.post('/:memberId/verify-pin', async (req, res) => {
  try {
    const member = await Member.findById(req.params.memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const valid = await bcrypt.compare(req.body.pin, member.pin);
    res.json({ valid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
