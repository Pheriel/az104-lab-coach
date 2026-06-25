const pool = require('./pool');

async function query(text, params) {
  return pool.query(text, params);
}

async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function testConnection() {
  try {
    await pool.query('SELECT NOW();');
    console.log('[DB] PostgreSQL connected successfully.');
  } catch (error) {
    console.error('[DB] PostgreSQL connection failed:');
    console.error(error);
    throw error;
  }
}

module.exports = { pool, query, transaction, testConnection };
