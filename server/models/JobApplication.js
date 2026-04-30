const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  company: { type: String, required: true },
  role: { type: String, required: true },
  source: { type: String, enum: ['linkedin', 'gmail', 'direct', 'link'], default: 'direct' },
  url: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['applied', 'interviewed', 'rejected', 'offered'], default: 'applied' },
  date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('JobApplication', JobApplicationSchema);
