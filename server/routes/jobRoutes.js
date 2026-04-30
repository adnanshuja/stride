const express = require('express');
const router = express.Router();
const JobApplication = require('../models/JobApplication');
const { verifyToken } = require('../middleware/auth');

// GET /:memberId — List all job applications for a member, sorted by date desc
router.get('/:memberId', verifyToken, async (req, res) => {
  try {
    const jobs = await JobApplication.find({ memberId: req.params.memberId })
      .sort({ date: -1, createdAt: -1 });
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST / — Create a job application
router.post('/', verifyToken, async (req, res) => {
  try {
    const { memberId, company, role, source, url, notes, status } = req.body;
    if (!memberId || !company || !role) {
      return res.status(400).json({ error: 'memberId, company, and role are required.' });
    }
    const job = await JobApplication.create({ memberId, company, role, source, url, notes, status });
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:jobId — Update job application
router.put('/:jobId', verifyToken, async (req, res) => {
  try {
    const { company, role, source, url, notes, status } = req.body;
    const update = {};
    if (company !== undefined) update.company = company;
    if (role !== undefined) update.role = role;
    if (source !== undefined) update.source = source;
    if (url !== undefined) update.url = url;
    if (notes !== undefined) update.notes = notes;
    if (status !== undefined) update.status = status;

    const job = await JobApplication.findByIdAndUpdate(
      req.params.jobId,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!job) return res.status(404).json({ error: 'Job application not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:jobId — Delete job application
router.delete('/:jobId', verifyToken, async (req, res) => {
  try {
    const job = await JobApplication.findByIdAndDelete(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job application not found' });
    res.json({ message: 'Job application deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
