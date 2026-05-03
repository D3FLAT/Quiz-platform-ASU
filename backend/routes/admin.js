const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const User = require('../models/User');

// Все квизы с инфой об авторе
router.get('/quizzes', adminMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz.findAll({
      order: [['created_at', 'DESC']],
      include: [
        { model: Question, attributes: ['id'] }
      ]
    });
    res.json(quizzes);
  } catch (err) {
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
    await user.update({ role });
    res.json({ message: `Role updated to ${role}`, user: { id: user.id, username: user.username, role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
