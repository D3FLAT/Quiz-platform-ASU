-- schema.sql
-- Схема базы данных для Quiz Platform

-- Удаляем таблицы если существуют (для чистой установки)
DROP TABLE IF EXISTS quiz_results CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица квизов
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    times_taken INTEGER DEFAULT 0,
    author VARCHAR(255) DEFAULT 'system'
);

-- Таблица вопросов
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Массив вариантов ответа в формате JSON
    correct_answer TEXT NOT NULL,
    position INTEGER DEFAULT 0 -- Порядок вопроса в квизе
);

-- Таблица результатов прохождения квизов
CREATE TABLE quiz_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    answers JSONB, -- Ответы пользователя в формате JSON
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаём индексы для ускорения запросов
CREATE INDEX idx_quizzes_created_at ON quizzes(created_at DESC);
CREATE INDEX idx_quizzes_times_taken ON quizzes(times_taken DESC);
CREATE INDEX idx_quizzes_category ON quizzes(category);
CREATE INDEX idx_quizzes_created_by ON quizzes(created_by);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX idx_quiz_results_quiz_id ON quiz_results(quiz_id);

-- Вставляем тестовые данные (опционально)
-- Можно удалить если не нужны

-- Тестовый пользователь (пароль: test123)
INSERT INTO users (username, email, password) VALUES 
('system', 'system@quizplatform.com', '$2a$10$dummy.hash.for.testing'),
('testuser', 'test@example.com', '$2a$10$dummy.hash.for.testing');

-- Тестовые квизы
INSERT INTO quizzes (title, description, category, author, times_taken, created_at) VALUES 
(
    'Основы JavaScript',
    'Проверьте свои знания основ JavaScript',
    'programming',
    'system',
    45,
    CURRENT_TIMESTAMP - INTERVAL '30 days'
),
(
    'HTML и CSS',
    'Тест на знание основ веб-разработки',
    'web',
    'system',
    23,
    CURRENT_TIMESTAMP - INTERVAL '15 days'
),
(
    'Python для начинающих',
    'Базовые концепции языка Python',
    'programming',
    'system',
    12,
    CURRENT_TIMESTAMP - INTERVAL '7 days'
);

-- Вопросы для квиза "Основы JavaScript" (id=1)
INSERT INTO questions (quiz_id, question, options, correct_answer, position) VALUES 
(
    1,
    'Как объявить переменную в JavaScript?',
    '["var x = 5", "variable x = 5", "v x = 5", "Все варианты верны"]',
    'var x = 5',
    1
),
(
    1,
    'Что выведет console.log(typeof null)?',
    '["null", "undefined", "object", "string"]',
    'object',
    2
),
(
    1,
    'Какой метод добавляет элемент в конец массива?',
    '["push()", "pop()", "shift()", "unshift()"]',
    'push()',
    3
);

-- Вопросы для квиза "HTML и CSS" (id=2)
INSERT INTO questions (quiz_id, question, options, correct_answer, position) VALUES 
(
    2,
    'Какой тег используется для создания ссылки?',
    '["<link>", "<a>", "<href>", "<url>"]',
    '<a>',
    1
),
(
    2,
    'Как изменить цвет текста в CSS?',
    '["text-color", "font-color", "color", "text-style"]',
    'color',
    2
),
(
    2,
    'Что делает свойство display: flex?',
    '["Создает гибкий контейнер", "Делает элементы невидимыми", "Позволяет элементам плавать", "Изменяет шрифт"]',
    'Создает гибкий контейнер',
    3
);

-- Вопросы для квиза "Python для начинающих" (id=3)
INSERT INTO questions (quiz_id, question, options, correct_answer, position) VALUES 
(
    3,
    'Как вывести текст на экран в Python?',
    '["print(\"Hello\")", "console.log(\"Hello\")", "echo \"Hello\"", "System.out.println(\"Hello\")"]',
    'print("Hello")',
    1
),
(
    3,
    'Какой тип данных используется для хранения целых чисел?',
    '["int", "integer", "number", "num"]',
    'int',
    2
),
(
    3,
    'Как создать список в Python?',
    '["list = []", "list = {}", "list = ()", "list = <>"]',
    'list = []',
    3
);

-- Выводим информацию о созданных таблицах
DO $$ 
BEGIN
    RAISE NOTICE 'Таблицы созданы:';
    RAISE NOTICE '- users (пользователи)';
    RAISE NOTICE '- quizzes (квизы)';
    RAISE NOTICE '- questions (вопросы)';
    RAISE NOTICE '- quiz_results (результаты)';
    RAISE NOTICE '';
    RAISE NOTICE 'Добавлены тестовые данные:';
    RAISE NOTICE '- 2 пользователя';
    RAISE NOTICE '- 3 квиза';
    RAISE NOTICE '- 9 вопросов';
END $$;
