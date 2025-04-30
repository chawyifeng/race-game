// initDatabase.cjs
const mysql = require("mysql2/promise");
require("dotenv").config();

const initDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``
  );
  console.log(`Database '${process.env.DB_NAME}' created or already exists.`);
  await connection.end();
};

module.exports = initDatabase;
