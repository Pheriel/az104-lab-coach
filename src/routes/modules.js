const express = require('express');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { requiredString, optionalString } = require('../utils/validators');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT m.*,
      COUNT(DISTINCT l.id)::int AS lab_count,
      COUNT(DISTINCT q.id)::int AS question_count
    FROM modules m
    LEFT JOIN labs l ON l.module_id = m.id
    LEFT JOIN quiz_questions q ON q.module_id = m.id
    GROUP BY m.id
    ORDER BY m.id
  `);
  res.json(result.rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  const name = requiredString(req.body.name, 'name', 120);
  const description = optionalString(req.body.description, 'description', 2000);
  const examWeight = optionalString(req.body.exam_weight, 'exam_weight', 40);

  const result = await db.query(
    'INSERT INTO modules (name, description, exam_weight) VALUES ($1, $2, $3) RETURNING *',
    [name, description, examWeight],
  );
  res.status(201).json(result.rows[0]);
}));

module.exports = router;
