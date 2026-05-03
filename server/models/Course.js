const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  completedAt: { type: Date, default: null },
  completedComment: { type: String, default: '' },
  totalTopics: { type: Number, default: 0 },
  completedTopics: { type: Number, default: 0 },
  totalCourseMinutes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Course', CourseSchema);
