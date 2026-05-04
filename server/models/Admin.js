const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  signupCode: { type: String, default: null },
  signupCodeDisplay: { type: String, default: null },
  signupCodeExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

AdminSchema.methods.generateSignupCode = async function () {
  const code = crypto.randomBytes(4).toString('hex');
  this.signupCode = await bcrypt.hash(code, 10);
  this.signupCodeDisplay = code;
  this.signupCodeExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await this.save();
  return code;
};

module.exports = mongoose.model('Admin', AdminSchema);
