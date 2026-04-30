const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  date: { type: String, required: true },
  hours: {
    type: Map,
    of: String,
    default: {},
  },
  courseHours: {
    type: Map,
    of: String,
    default: {},
  },
  autoDetected: {
    type: [
      {
        source: String,
        company: String,
        role: String,
        time: String,
        hour: String,
      },
    ],
    default: [],
  },
  startedAt: { type: String, default: null },
  breakCount: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

DailyLogSchema.index({ memberId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', DailyLogSchema);
