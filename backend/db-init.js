// backend/db-init.js
// Инициализация базы данных PostgreSQL

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Подключение к PostgreSQL (к базе postgres для создания новой БД)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
  database: 'postgres' // Подключаемся к postgres для создания quizdb
});

async function initDatabase() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('✅ Подключение к PostgreSQL установлено');

    // Проверяем существование базы данных
    const dbName = process.env.DB_NAME || 'quizdb';
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (dbCheck.rows.length === 0) {
      console.log(`📦 Создаём базу данных ${dbName}...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ База данных ${dbName} создана`);
    } else {
      console.log(`✅ База данных ${dbName} уже существует`);
    }

    // Закрываем соединение с postgres
    client.release();
    await pool.end();

    // Переподключаемся к созданной базе данных
    const dbPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 5432,
      database: dbName
    });

    const dbClient = await dbPool.connect();
    console.log(`✅ Подключились к базе данных ${dbName}`);

    // Применяем схему, если файл schema.sql существует
    // Правильный путь: schema.sql находится в той же папке что и db-init.js
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      console.log('📄 Применяем схему из schema.sql...');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      await dbClient.query(schema);
      console.log('✅ Схема базы данных применена');
    } else {
      console.log('⚠️  Файл schema.sql не найден по пути:', schemaPath);
      console.log('   Создайте базовые таблицы вручную или добавьте schema.sql');
    }

    dbClient.release();
    await dbPool.end();

    console.log('🎉 Инициализация базы данных завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error.message);
    throw error;
  }
}

// Экспортируем функцию для использования в server.js
module.exports = initDatabase;

// Если запущен напрямую (node db-init.js)
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('✅ Скрипт выполнен успешно');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Ошибка выполнения скрипта:', error);
      process.exit(1);
    });
}