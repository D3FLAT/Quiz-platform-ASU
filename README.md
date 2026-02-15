# QuizQuest 🎯 Название будет меняться

QuizQuest — это full-stack веб-приложение для проведения викторин с сохранением данных в PostgreSQL.

Проект демонстрирует работу клиент-серверной архитектуры, взаимодействие Node.js с базой данных и автоматическую инициализацию БД при первом запуске.

---

## 📦 Используемые технологии

- Node.js  
- Express  
- PostgreSQL  
- pg (node-postgres)  
- concurrently  
- http-server  

---

## 🏗 Архитектура проекта

### Backend
- REST API на Express  
- Подключение к PostgreSQL  
- Автоматическая проверка и создание базы данных  
- Автоматическое применение `schema.sql`  

### Frontend
- Статический HTML/CSS/JS  
- Запуск через `http-server`  
- Взаимодействие с backend через HTTP-запросы  

---

## 📁 Структура проекта

```
webtech/
│
├── backend/
│   ├── server.js
│   ├── db-init.js
│   ├── schema.sql
│   ├── .env
│
├── site/
│   └── (frontend файлы)
│
├── package.json
└── README.md
```

---

## 🚀 Быстрый запуск

### 1️⃣ Установить необходимые программы

Должны быть установлены:

- Node.js (LTS)  
- PostgreSQL  

Проверка:

```bash
node -v
npm -v
```

---

### 2️⃣ Настроить PostgreSQL

- Установить PostgreSQL  
- Запомнить пароль пользователя `postgres`  

---

### 3️⃣ Создать файл `.env`

В папке `backend` создать файл `.env` со следующим содержимым:

```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=itquiz
PORT=5000
```

Пароль должен совпадать с тем, который задан при установке PostgreSQL.

---

### 4️⃣ Установить зависимости

В корне проекта выполнить:

```bash
npm install
```

---

### 5️⃣ Запустить проект

```bash
npm start
```

После запуска:

- Frontend: http://localhost:3000  
- Backend: http://localhost:5000  

---

## 🧠 Автоматическая инициализация базы данных

При первом запуске приложение автоматически:

- Проверяет наличие базы данных  
- Создаёт её при отсутствии  
- Проверяет наличие таблиц  
- Применяет `schema.sql` при необходимости  

Дополнительных SQL-команд вручную выполнять не требуется.

---

## 🛠 Доступные команды

```bash
npm start        # Запуск backend и frontend
npm run backend  # Только сервер
npm run frontend # Только frontend
```

---

## 🔄 Полный сброс базы данных

Если нужно полностью пересоздать базу:

1. Удалить базу данных `itquiz` через pgAdmin или выполнить:

```sql
DROP DATABASE itquiz;
```

2. Запустить проект снова:

```bash
npm start
```

База и таблицы будут созданы автоматически.

---

## 📌 Требования

- Node.js 18+  
- PostgreSQL 14+  
- npm 8+  

---
