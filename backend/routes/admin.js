const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const Quiz = require('../models/Quiz');
const Question = require("../models/Question"); 
const User = require('../models/User');

Quiz.hasMany(Question, { foreignKey: 'quiz_id' });
Question.belongsTo(Quiz, { foreignKey: 'quiz_id' });

const SUPERADMIN = 'Вова'; // ← имя суперадмина, которого нельзя тронуть

// Все квизы
router.get('/quizzes', adminMiddleware, async (req, res) => {
  try {
    console.log('DB URL:', process.env.DATABASE_URL);
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT id, title FROM quizzes ORDER BY id');
    console.log('ALL QUIZZES:', result.rows);
    await pool.end();
    res.json(result.rows);
  } catch (err) {
    console.error('ADMIN QUIZZES ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Все пользователи
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    console.error('ADMIN USERS ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Удалить любой квиз
router.delete('/quizzes/:id', adminMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    await quiz.destroy();
    res.json({ message: 'Quiz deleted by admin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Изменить роль пользователя
router.patch('/users/:id/role', adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Защита суперадмина
    if (user.username === SUPERADMIN) {
      return res.status(403).json({ error: `Нельзя изменить роль суперадмина` });
    }

    await user.update({ role });
    res.json({ message: `Role updated to ${role}`, user: { id: user.id, username: user.username, role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;