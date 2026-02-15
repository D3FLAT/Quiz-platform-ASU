-- 1. Создание базы (выполняется один раз, из psql)
CREATE DATABASE quizdb;

-- После этого — подключись к базе
\c quizdb;

-- 2. Таблица пользователей
CREATE TABLE "Users" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Таблица квизов
CREATE TABLE "Quizzes" (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Таблица вопросов
CREATE TABLE "Questions" (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES "Quizzes"(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options TEXT[] NOT NULL, -- массив строк
    correct_option_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Таблица результатов
CREATE TABLE "Results" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    quiz_id INTEGER NOT NULL REFERENCES "Quizzes"(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
