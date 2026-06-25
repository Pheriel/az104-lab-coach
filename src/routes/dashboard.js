const express = require('express');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const [progress, activeLabs, recentAttempts, objectives] = await Promise.all([
    db.query(`
      SELECT
        COUNT(l.id)::int AS total_labs,
        COUNT(*) FILTER (WHERE COALESCE(p.status, 'not_started') = 'completed')::int AS completed_labs,
        COUNT(*) FILTER (WHERE COALESCE(p.status, 'not_started') = 'in_progress')::int AS in_progress_labs,
        ROUND(
          CASE WHEN COUNT(l.id) = 0 THEN 0
          ELSE COUNT(*) FILTER (WHERE COALESCE(p.status, 'not_started') = 'completed') * 100.0 / COUNT(l.id)
          END
        )::int AS completion_percent
      FROM labs l
      LEFT JOIN user_lab_progress p ON p.lab_id = l.id
    `),
    db.query(`
      SELECT l.id, l.title, m.name AS module_name, p.status, p.updated_at,
        COALESCE(array_length(p.completed_step_ids, 1), 0)::int AS completed_steps,
        COUNT(s.id)::int AS total_steps
      FROM user_lab_progress p
      JOIN labs l ON l.id = p.lab_id
      JOIN modules m ON m.id = l.module_id
      LEFT JOIN lab_steps s ON s.lab_id = l.id
      WHERE p.status = 'in_progress'
      GROUP BY l.id, m.name, p.status, p.updated_at, p.completed_step_ids
      ORDER BY p.updated_at DESC
      LIMIT 4
    `),
    db.query(`
      SELECT qa.*, m.name AS module_name
      FROM quiz_attempts qa
      LEFT JOIN modules m ON m.id = qa.module_id
      ORDER BY qa.created_at DESC
      LIMIT 4
    `),
    db.query(`
      SELECT m.id, m.name, m.exam_weight,
        COUNT(DISTINCT l.id)::int AS labs,
        COUNT(DISTINCT q.id)::int AS questions
      FROM modules m
      LEFT JOIN labs l ON l.module_id = m.id
      LEFT JOIN quiz_questions q ON q.module_id = m.id
      GROUP BY m.id
      ORDER BY m.id
    `),
  ]);

  res.json({
    progress: progress.rows[0],
    activeLabs: activeLabs.rows,
    recentAttempts: recentAttempts.rows,
    objectives: objectives.rows,
  });
}));

module.exports = router;
