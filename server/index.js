require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes mounted in Chunk 3
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);
// Routes mounted in Chunk 4
const memberRoutes = require('./routes/memberRoutes');
const logRoutes = require('./routes/logRoutes');
app.use('/api/members', memberRoutes);
app.use('/api/logs', logRoutes);
// Routes mounted in Chunk 6
const authRoutes = require('./routes/authRoutes');
const scanRoutes = require('./routes/scanRoutes');
const courseRoutes = require('./routes/courseRoutes');
const jobRoutes = require('./routes/jobRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/jobs', jobRoutes);

app.listen(PORT, () => {
  console.log(`StrideSync server running on port ${PORT}`);
});
