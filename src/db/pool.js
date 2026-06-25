require('dotenv').config();
const { Pool } = require('pg');

const requiredEnv = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`[DB] Missing environment variable: ${key}`);
    throw new Error(`[DB] Missing environment variable: ${key}`);
  }
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
});

module.exports = pool;
