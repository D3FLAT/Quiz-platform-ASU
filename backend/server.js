const app = require('./app');
const sequelize = require('./config/db');
const PORT = process.env.PORT || 5000;
const initDatabase = require("./db-init");

(async () => {
  try {
    await initDatabase();
  } catch (err) {
    console.error("❌ Ошибка инициализации БД:", err);
    process.exit(1);
  }
})();


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
