const Result = require('../models/Result');
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');

exports.submitQuiz = async (req, res) => {
  const { answers } = req.body;
  try {
    const quiz = await Quiz.findByPk(req.params.id, { include: Question });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    let score = 0;
    quiz.Questions.forEach((q, index) => {
      if (q.correctIndex === answers[index]) score++;
    });

    const result = await Result.create({
      score,
      UserId: req.user.userId,
      QuizId: quiz.id
    });

    res.json({ message: 'Result saved', score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
