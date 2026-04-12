const app = require('./app');
const sequelize = require('./config/db');
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('✅ Подключение к БД установлено');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Не удалось подключиться к БД:', err.message);
    process.exit(1);
  });