// === Конфигурация ===
const API_BASE = "http://localhost:5000/api";
let token = localStorage.getItem('token');

// === Регистрация ===
async function register(username, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();
  console.log("Register:", data);
}

// === Вход ===
async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    localStorage.setItem('token', token);
    console.log("Login successful");
  } else {
    console.error("Login failed", data);
  }
}

// === Получить квизы ===
async function fetchQuizzes() {
  const res = await fetch(`${API_BASE}/quizzes`);
  const quizzes = await res.json();
  console.log("Quizzes:", quizzes);
  return quizzes;
}

// === Получить один квиз ===
async function fetchQuiz(id) {
  const res = await fetch(`${API_BASE}/quizzes/${id}`);
  const quiz = await res.json();
  console.log("Quiz:", quiz);
  return quiz;
}

// === Отправить результат ===
async function submitQuiz(id, answers) {
  const res = await fetch(`${API_BASE}/quizzes/${id}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ answers })
  });
  const result = await res.json();
  console.log("Result:", result);
  return result;
}