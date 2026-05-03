const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');

dotenv.config();
const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

module.exports = app;
