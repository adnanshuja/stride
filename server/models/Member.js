const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  category: { type: String, enum: ['FREE', 'RESTRICTED'], default: 'FREE' },
  passwordHash: { type: String, default: null },
  isActive: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  gmailRefreshToken: { type: String, default: null },
  gmailEmail: { type: String, default: null },
  restrictedKeywords: {
    type: [String],
    default: [
      'applied', 'application', 'LinkedIn', 'LangChain', 'AutoGen', 'agent',
      'interview', 'resume', 'Coursera', 'Udemy', 'Claude', 'GPT', 'LLM',
      'agentic', 'AI engineer', 'machine learning', 'course', 'offer',
    ],
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Member', MemberSchema);
