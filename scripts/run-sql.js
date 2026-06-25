const fs = require('fs/promises');
const path = require('path');
const { pool } = require('../src/db');

async function main() {
  const sqlFile = process.argv[2];
  if (!sqlFile) {
    console.error('Usage: node scripts/run-sql.js <sql-file>');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), sqlFile);
  const sql = await fs.readFile(filePath, 'utf8');
  await pool.query(sql);
  await pool.end();
  console.log(`[DB] Executed ${sqlFile}`);
}

main().catch(async (error) => {
  console.error('[DB] SQL execution failed:');
  console.error(error);
  await pool.end().catch(() => {});
  process.exit(1);
});
