const { Client } = require("pg");
const fs = require("fs");
require("dotenv").config();

const dbName = process.env.DB_NAME || "itquiz";

async function initDatabase() {
  const adminClient = new Client({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    database: "postgres", // подключаемся к служебной БД
  });

  await adminClient.connect();

  // Проверяем существует ли база
  const res = await adminClient.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [dbName]
  );

  if (res.rowCount === 0) {
    console.log("📦 База не найдена. Создаём...");
    await adminClient.query(`CREATE DATABASE ${dbName}`);
    console.log("✅ База создана.");
  } else {
    console.log("✅ База уже существует.");
  }

  await adminClient.end();

  // Подключаемся к основной БД
  const dbClient = new Client({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    database: dbName,
  });

  await dbClient.connect();

  // Проверяем есть ли таблицы
  const tables = await dbClient.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`
  );

  if (tables.rowCount === 0) {
    console.log("📄 Таблицы не найдены. Применяем schema.sql...");
    const schema = fs.readFileSync("./backend/schema.sql").toString();
    await dbClient.query(schema);
    console.log("✅ schema.sql применён.");
  } else {
    console.log("✅ Таблицы уже существуют.");
  }

  await dbClient.end();
}

module.exports = initDatabase;