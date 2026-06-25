const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/stats', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM modules) AS modules,
      (SELECT COUNT(*)::int FROM labs) AS labs,
      (SELECT COUNT(*)::int FROM lab_steps) AS lab_steps,
      (SELECT COUNT(*)::int FROM quiz_questions) AS quiz_questions,
      (SELECT COUNT(*)::int FROM notes) AS notes,
      (SELECT COUNT(*)::int FROM resources) AS resources
  `);
  res.json(result.rows[0]);
}));

router.post('/reset-demo-data', asyncHandler(async (req, res) => {
  const seedPath = path.join(__dirname, '..', '..', 'db', 'seed.sql');
  const seedSql = await fs.readFile(seedPath, 'utf8');
  await db.transaction(async (client) => {
    await client.query(seedSql);
  });
  res.json({ ok: true, message: 'Demo data reset complete' });
}));

module.exports = router;
