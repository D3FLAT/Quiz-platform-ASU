const express = require("express");
const router = express.Router();

let quizzes = [
  {
    id: 1,
    title: "JS тестовый",
    questions: [
      {
        question: "2+2",
        options: ["3", "4", "5"],
        answer: 1
      }
    ]
  }
];


// получить все квизы
router.get("/", (req, res) => {
  res.json(quizzes);
});


// получить по id
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const quiz = quizzes.find(q => q.id === id);

  if (!quiz) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json(quiz);
});


// создать квиз
router.post("/", (req, res) => {
  const quiz = req.body;

  quiz.id = Date.now();

  quizzes.push(quiz);

  res.json(quiz);
});


module.exports = router;