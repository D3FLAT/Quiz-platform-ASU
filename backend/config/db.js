// backend/config/db.js
// Загружаем .env из корня backend папки
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { Sequelize } = require('sequelize');

console.log('=== Проверка DATABASE_URL ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  console.error('\n❌ ОШИБКА: DATABASE_URL не найден!');
  console.error('\nПроверьте:');
  console.error('1. Файл backend/.env существует');
  console.error('2. В нём есть строка: DATABASE_URL=postgresql://postgres:@localhost:5432/quizdb');
  console.error('3. Нет лишних пробелов или кавычек');
  console.error('\nТекущая директория:', __dirname);
  console.error('Ожидаемый путь к .env:', path.join(__dirname, '..', '.env'));
  process.exit(1);
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

// Тестируем подключение
sequelize.authenticate()
  .then(() => {
    console.log('✅ Подключение к PostgreSQL успешно установлено');
    console.log('📊 База данных:', sequelize.config.database);
  })
  .catch(err => {
    console.error('❌ Ошибка подключения к базе данных:');
    console.error(err.message);
    process.exit(1);
  });

module.exports = sequelize;