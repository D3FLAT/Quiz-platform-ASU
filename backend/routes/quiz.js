const express = require('express');
const router = express.Router();
const { getAllQuizzes, getQuizById } = require('../controllers/quizController');
const { submitQuiz } = require('../controllers/resultController');
const auth = require('../middleware/authMiddleware');

router.get('/', getAllQuizzes);
router.get('/:id', getQuizById);
router.post('/:id/submit', auth, submitQuiz);

module.exports = router;
