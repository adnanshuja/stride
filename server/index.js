require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Start connecting immediately; await in middleware for non-health routes
const dbReady = connectDB().catch((err) => {
  console.error('MongoDB connection failed:', err.message);
});

app.use((req, res, next) => {
  if (req.path === '/api/health') return next();
  dbReady.then(() => next()).catch(() =>
    res.status(503).json({ error: 'Database not available' })
  );
});

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

// Serve built frontend in local production
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`StrideSync server running on port ${PORT}`);
  });
}
