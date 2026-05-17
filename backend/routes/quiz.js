const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const authMiddleware = require("../middleware/authMiddleware");

Quiz.hasMany(Question, { foreignKey: 'quiz_id' });
Question.belongsTo(Quiz, { foreignKey: 'quiz_id' });

// Получить все квизы
router.get("/", async (req, res) => {
  try {
    const quizzes = await Quiz.findAll({ order: [["created_at", "DESC"]] });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить квиз по id (с вопросами)
router.get("/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [{
        model: Question,
        as: undefined
      }]
    });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать квиз (требует авторизации)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, category, questions } = req.body;
    console.log('CREATE QUIZ - questions received:', JSON.stringify(questions?.slice(0,1)));
    
    if (!title) return res.status(400).json({ error: "Title is required" });

    const quiz = await Quiz.create({
      title,
      description: description || "",
      category: category || "other",
      created_by: req.user.userId,
      author: req.user.username,
      times_taken: 0
    });

    console.log('Quiz created with id:', quiz.id);

    if (questions && questions.length > 0) {
      const questionsData = questions.map((q, i) => ({
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer || q.answer,
        position: i + 1,
        quiz_id: quiz.id
      }));
      console.log('Saving questions:', JSON.stringify(questionsData[0]));
      try {
        await Question.bulkCreate(questionsData);
        console.log('Questions saved OK');
      } catch (qErr) {
        console.error('bulkCreate ERROR:', qErr.message);
      }
    } else {
      console.log('No questions in request!');
    }

    const fullQuiz = await Quiz.findByPk(quiz.id, { include: Question });
    res.status(201).json(fullQuiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить квиз (только создатель)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    if (quiz.created_by !== req.user.userId) {
      return res.status(403).json({ error: "Forbidden: you are not the creator" });
    }

    await quiz.destroy();
    res.json({ message: "Quiz deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновить квиз (только создатель)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    if (quiz.created_by !== req.user.userId) {
      return res.status(403).json({ error: "Forbidden: you are not the creator" });
    }

    const { title, description, category } = req.body;
    await quiz.update({ title, description, category });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Счётчик прохождений
router.post("/:id/increment", async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    await quiz.increment("times_taken");
    res.json({ times_taken: quiz.times_taken + 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;