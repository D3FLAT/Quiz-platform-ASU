// script.js - Интеграция с Backend API
// Этот файл переопределяет функции из index.html для работы с сервером

// === Конфигурация ===
const API_BASE = "http://127.0.0.1:5000/api";
let token = localStorage.getItem('token');

// Флаг готовности API
let apiReady = false;

// ============================================
// ПРОВЕРКА ДОСТУПНОСТИ API
// ============================================

async function checkAPI() {
  try {
    const res = await fetch(`${API_BASE}/health`);

    const data = await res.json();

    if (data.status !== "ok") {
      throw new Error("Bad status");
    }

    console.log("API OK");

  } catch (e) {
    console.error(e);
    alert("Нет соединения с сервером");
  }
}



// ============================================
// ПЕРЕОПРЕДЕЛЕНИЕ ФУНКЦИЙ АВТОРИЗАЦИИ
// ============================================

/**
 * Регистрация пользователя через API
 */
async function registerUser() {
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      console.log("Registration successful:", data);
      showMessage('registerMessage', 'Регистрация прошла успешно! Теперь вы можете войти', 'success');
      document.getElementById('registerForm').reset();

      setTimeout(() => {
        showPage('login');
      }, 1500);
    } else {
      showMessage('registerMessage', data.error || 'Ошибка при регистрации', 'danger');
    }
  } catch (error) {
    console.error("Registration error:", error);
    showMessage('registerMessage', 'Ошибка соединения с сервером', 'danger');
  }
}

/**
 * Вход пользователя через API
 */
async function loginUser() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  // Используем username как email для совместимости
  const email = username;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok && data.token) {
      token = data.token;
      localStorage.setItem('token', token);
      currentUser = data.user?.username || username;
      localStorage.setItem('currentUser', currentUser);
      
      updateAuthUI();
      showMessage('loginMessage', 'Вход выполнен успешно!', 'success');
      document.getElementById('loginForm').reset();

      console.log("Login successful:", data);

      setTimeout(() => {
        showPage('home');
      }, 1000);
    } else {
      showMessage('loginMessage', data.error || 'Неверное имя пользователя или пароль', 'danger');
    }
  } catch (error) {
    console.error("Login error:", error);
    showMessage('loginMessage', 'Ошибка соединения с сервером', 'danger');
  }
}

/**
 * Выход пользователя
 */
function logout() {
  currentUser = null;
  token = null;
  localStorage.removeItem('currentUser');
  localStorage.removeItem('token');
  updateAuthUI();
  showPage('home');
  console.log("User logged out");
}

// ============================================
// ПЕРЕОПРЕДЕЛЕНИЕ ФУНКЦИЙ РАБОТЫ С КВИЗАМИ
// ============================================

/**
 * Загрузка списка квизов через API
 */
async function loadQuizzes() {
  const quizList = document.getElementById('quizList');
  const myQuizList = document.getElementById('myQuizList');

  if (!quizList || !myQuizList) return;

  // Показываем загрузку
  quizList.innerHTML = '<p>Загрузка квизов...</p>';
  myQuizList.innerHTML = '<p>Загрузка...</p>';

  try {
    const res = await fetch(`${API_BASE}/quizzes`);
    const data = await res.json();

    // Проверяем формат ответа
    const quizzes = data.quizzes || data;

    if (!Array.isArray(quizzes)) {
      throw new Error('Неверный формат данных от сервера');
    }

    console.log("Loaded quizzes from API:", quizzes);

    // Очищаем списки
    quizList.innerHTML = '';
    myQuizList.innerHTML = '';

    // Получаем отфильтрованные квизы
    const filteredQuizzes = filterQuizzes(quizzes);

    if (filteredQuizzes.length === 0) {
      quizList.innerHTML = '<p>Квизы не найдены</p>';
    } else {
      filteredQuizzes.forEach(quiz => {
        const quizCard = createQuizCard(quiz);
        quizList.appendChild(quizCard.cloneNode(true));

        // Добавляем в "Мои квизы" если пользователь - автор
        if (quiz.author === currentUser || quiz.created_by === currentUser) {
          myQuizList.appendChild(quizCard.cloneNode(true));
        }
      });
    }

    if (myQuizList.children.length === 0) {
      myQuizList.innerHTML = '<p>Вы еще не создали ни одного квиза</p>';
    }
  } catch (error) {
    console.error("Error loading quizzes:", error);
    quizList.innerHTML = '<p>Ошибка загрузки квизов. Проверьте подключение к серверу.</p>';
    myQuizList.innerHTML = '<p>Ошибка загрузки</p>';
  }
}

/**
 * Создание карточки квиза
 */
function createQuizCard(quiz) {
  const quizCard = document.createElement('div');
  quizCard.className = 'quiz-card';

  // Обработка даты
  const dateStr = quiz.created_at || quiz.createdAt || new Date().toISOString();
  const date = new Date(dateStr);
  const formattedDate = date.toLocaleDateString('ru-RU');

  // Обработка популярности
  const popularity = quiz.times_taken || quiz.popularity || 0;

  quizCard.innerHTML = `
    <h3>${quiz.title}</h3>
    <p>${quiz.description || 'Без описания'}</p>
    <div class="quiz-meta">
      <span>📁 ${getCategoryName(quiz.category)}</span>
      <span>👤 ${quiz.author === 'system' ? 'Система' : (quiz.author || 'Неизвестен')}</span>
      <span>📅 ${formattedDate}</span>
      <span>👥 ${popularity}</span>
    </div>
    <button class="btn" onclick="startQuiz('${quiz.id}')">Начать</button>
    ${(quiz.author === currentUser || quiz.created_by === currentUser) ? 
      `<button class="btn btn-danger" onclick="deleteQuiz('${quiz.id}')">Удалить</button>` : ''}
  `;

  return quizCard;
}

/**
 * Начать прохождение квиза через API
 */
async function startQuiz(quizId) {
  if (!currentUser) {
    showPage('login');
    showMessage('loginMessage', 'Для прохождения квиза необходимо войти', 'danger');
    return;
  }

  try {
    // Загружаем полные данные квиза
    const res = await fetch(`${API_BASE}/quizzes/${quizId}`);
    const quiz = await res.json();

    if (!quiz || !quiz.questions) {
      throw new Error('Квиз не найден или не содержит вопросов');
    }

    console.log("Starting quiz:", quiz);

    // Увеличиваем счетчик прохождений
    try {
      await fetch(`${API_BASE}/quizzes/${quizId}/increment`, {
        method: 'POST'
      });
    } catch (e) {
      console.log('Счетчик не обновлен:', e);
    }

    // Устанавливаем глобальные переменные
    currentQuiz = quiz;
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];

    // Настраиваем UI
    document.getElementById('quizPlayTitle').textContent = quiz.title;
    document.getElementById('quizPlayDescription').textContent = quiz.description || '';
    document.getElementById('scoreValue').textContent = '0';
    document.getElementById('quizPlayArea').style.display = 'block';
    document.getElementById('quizResults').style.display = 'none';

    showQuestion();
    showPage('play-quiz');
  } catch (error) {
    console.error("Error starting quiz:", error);
    alert('Ошибка загрузки квиза: ' + error.message);
  }
}

/**
 * Завершение квиза и отправка результатов на сервер
 */
async function finishQuiz() {
  document.getElementById('quizPlayArea').style.display = 'none';
  document.getElementById('quizResults').style.display = 'block';

  document.getElementById('finalScore').textContent = score;
  document.getElementById('totalQuestions').textContent = currentQuiz.questions.length;

  const percentage = (score / currentQuiz.questions.length) * 100;
  let message = '';

  if (percentage >= 80) {
    message = 'Отличный результат! Вы настоящий эксперт!';
  } else if (percentage >= 50) {
    message = 'Хороший результат! Есть куда расти.';
  } else {
    message = 'Попробуйте еще раз! У вас все получится!';
  }

  document.getElementById('quizResultMessage').textContent = message;

  // Отправляем результат на сервер
  try {
    const res = await fetch(`${API_BASE}/quizzes/${currentQuiz.id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        answers: userAnswers,
        score: score,
        total: currentQuiz.questions.length
      })
    });

    const result = await res.json();
    console.log("Quiz result submitted:", result);
  } catch (error) {
    console.error("Error submitting quiz result:", error);
    // Не показываем ошибку пользователю, результат локально сохранен
  }
}

/**
 * Сохранить новый квиз через API
 */
async function saveQuiz() {
  if (!currentUser) {
    showPage('login');
    showMessage('loginMessage', 'Для создания квиза необходимо войти', 'danger');
    return;
  }

  const title = document.getElementById('quizTitle').value.trim();
  const description = document.getElementById('quizDescription').value.trim();
  const category = document.getElementById('quizCategory').value;

  const questionItems = document.querySelectorAll('.question-item');
  if (questionItems.length === 0) {
    showMessage('quizMessage', 'Добавьте хотя бы один вопрос', 'danger');
    return;
  }

  const questions = [];
  let hasErrors = false;

  questionItems.forEach((item, index) => {
    const questionText = item.querySelector('.question-text').value.trim();
    const options = Array.from(item.querySelectorAll('.option')).map(opt => opt.value.trim());
    const correctAnswerIndex = parseInt(item.querySelector('.correct-answer').value);

    if (!questionText || options.some(opt => !opt)) {
      hasErrors = true;
      return;
    }

    questions.push({
      question: questionText,
      options: options,
      answer: options[correctAnswerIndex]
    });
  });

  if (hasErrors) {
    showMessage('quizMessage', 'Заполните все поля вопросов и ответов', 'danger');
    return;
  }

  // Создаем объект квиза
  const newQuiz = {
    title,
    description,
    category,
    questions
  };

  try {
    const res = await fetch(`${API_BASE}/quizzes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newQuiz)
    });

    const data = await res.json();

    if (res.ok) {
      console.log("Quiz created:", data);
      showMessage('quizMessage', 'Квиз успешно сохранен!', 'success');
      document.getElementById('quizForm').reset();

      setTimeout(() => {
        showPage('quizzes');
        loadQuizzes(); // Перезагружаем список
      }, 1500);
    } else {
      showMessage('quizMessage', data.error || 'Ошибка при создании квиза', 'danger');
    }
  } catch (error) {
    console.error("Error saving quiz:", error);
    showMessage('quizMessage', 'Ошибка соединения с сервером', 'danger');
  }
}

/**
 * Удаление квиза через API
 */
async function deleteQuiz(quizId) {
  if (!confirm('Вы уверены, что хотите удалить этот квиз?')) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/quizzes/${quizId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      console.log("Quiz deleted:", quizId);
      loadQuizzes(); // Перезагружаем список
    } else {
      const data = await res.json();
      alert(data.error || 'Ошибка при удалении квиза');
    }
  } catch (error) {
    console.error("Error deleting quiz:", error);
    alert('Ошибка соединения с сервером');
  }
}

// ============================================
// ФИЛЬТРАЦИЯ КВИЗОВ (работает с API данными)
// ============================================

/**
 * Фильтрация и сортировка квизов
 */
function filterQuizzes(data) {
  let result = [...data];

  const searchInput = document.getElementById('searchInput');
  const filterSelect = document.getElementById('filterSelect');

  if (!searchInput || !filterSelect) return result;

  const searchText = searchInput.value.toLowerCase().trim();

  // Поиск
  if (searchText) {
    result = result.filter(q => {
      const title = (q.title || '').toLowerCase();
      return title.includes(searchText);
    });
  }

  // Сортировка
  const filterValue = filterSelect.value;

  if (filterValue === 'name') {
    result.sort((a, b) => a.title.localeCompare(b.title));
  } else if (filterValue === 'date') {
    result.sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0);
      const dateB = new Date(b.created_at || b.createdAt || 0);
      return dateB - dateA; // Новые первыми
    });
  } else if (filterValue === 'popularity') {
    result.sort((a, b) => {
      const popA = a.times_taken || a.popularity || 0;
      const popB = b.times_taken || b.popularity || 0;
      return popB - popA;
    });
  }

  // Сохранить настройки
  localStorage.setItem('filterValue', filterValue);
  localStorage.setItem('searchValue', searchText);

  return result;
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

// Ждем загрузки DOM и проверяем API
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Script.js загружен - работаем с Backend API');
  
  // Проверяем подключение к API
  await checkAPIConnection();

  // Инициализируем обработчики фильтра
  initFilterHandlers();

  // Если мы на странице квизов, загружаем их
  const quizzesPage = document.getElementById('quizzes');
  if (quizzesPage && quizzesPage.classList.contains('active')) {
    loadQuizzes();
  }

  console.log('✅ Инициализация завершена');
  console.log('API Base:', API_BASE);
  console.log('Token:', token ? 'Есть' : 'Нет');
});

/**
 * Инициализация обработчиков фильтра
 */
function initFilterHandlers() {
  const searchInput = document.getElementById('searchInput');
  const filterSelect = document.getElementById('filterSelect');

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      loadQuizzes();
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', function() {
      loadQuizzes();
    });
  }

  // Загружаем сохраненные настройки
  loadFilterSettings();
}

/**
 * Загрузка сохраненных настроек фильтра
 */
function loadFilterSettings() {
  const savedFilter = localStorage.getItem('filterValue');
  const savedSearch = localStorage.getItem('searchValue');

  const searchInput = document.getElementById('searchInput');
  const filterSelect = document.getElementById('filterSelect');

  if (savedFilter && filterSelect) {
    filterSelect.value = savedFilter;
  }

  if (savedSearch && searchInput) {
    searchInput.value = savedSearch;
  }
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Получение названия категории
 */
function getCategoryName(category) {
  const categories = {
    'programming': 'Программирование',
    'web': 'Веб-разработка',
    'algorithms': 'Алгоритмы',
    'databases': 'Базы данных',
    'other': 'Другое'
  };
  return categories[category] || category;
}

/**
 * Показать сообщение
 */
function showMessage(elementId, message, type) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = message;
  element.className = `alert alert-${type}`;
  element.style.display = 'block';

  setTimeout(() => {
    element.style.display = 'none';
  }, 5000);
}

// ============================================
// ЭКСПОРТ ДЛЯ КОНСОЛИ РАЗРАБОТЧИКА
// ============================================

window.apiTools = {
  checkAPIConnection,
  token: () => token,
  apiBase: API_BASE,
  reloadQuizzes: loadQuizzes
};

console.log('%c API Tools доступны через window.apiTools ', 'background: #3498db; color: white; padding: 5px;');