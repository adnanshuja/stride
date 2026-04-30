const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Topic = require('../models/Topic');
const { verifyToken } = require('../middleware/auth');

// GET /:memberId — List all courses for a member
router.get('/:memberId', verifyToken, async (req, res) => {
  try {
    const courses = await Course.find({ memberId: req.params.memberId }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST / — Create a course
router.post('/', verifyToken, async (req, res) => {
  try {
    const { memberId, name, description } = req.body;
    if (!memberId || !name) {
      return res.status(400).json({ error: 'memberId and name are required' });
    }
    const course = await Course.create({ memberId, name, description });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:courseId — Update course
router.put('/:courseId', verifyToken, async (req, res) => {
  try {
    const updates = {};
    const allowedFields = ['name', 'description', 'status', 'completedComment'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.status === 'completed') {
      updates.completedAt = new Date();
    } else if (updates.status === 'active') {
      updates.completedAt = null;
      updates.completedComment = '';
    }

    const course = await Course.findByIdAndUpdate(req.params.courseId, updates, { new: true });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:courseId — Delete course and all its topics
router.delete('/:courseId', verifyToken, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    await Topic.deleteMany({ courseId: req.params.courseId });
    res.json({ message: 'Course and topics deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:courseId/topics — List topics for a course
router.get('/:courseId/topics', verifyToken, async (req, res) => {
  try {
    const topics = await Topic.find({ courseId: req.params.courseId }).sort({ order: 1 });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /:courseId/topics — Add a topic
router.post('/:courseId/topics', verifyToken, async (req, res) => {
  try {
    const { name, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Topic name is required' });

    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const count = await Topic.countDocuments({ courseId: req.params.courseId });
    const topic = await Topic.create({ courseId: req.params.courseId, name, notes, order: count });

    await Course.findByIdAndUpdate(req.params.courseId, { totalTopics: count + 1 });

    res.status(201).json(topic);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:courseId/topics/:topicId — Delete a topic
router.delete('/:courseId/topics/:topicId', verifyToken, async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.topicId);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    const course = await Course.findById(req.params.courseId);
    if (course && course.totalTopics > 0) {
      await Course.findByIdAndUpdate(req.params.courseId, { totalTopics: course.totalTopics - 1 });
    }

    res.json({ message: 'Topic deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
