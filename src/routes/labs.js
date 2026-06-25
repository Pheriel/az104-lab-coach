const express = require('express');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { notFound } = require('../utils/errors');
const {
  requiredString,
  optionalString,
  positiveInt,
  enumValue,
  stringArray,
} = require('../utils/validators');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const filters = [];
  const params = [];

  if (req.query.module_id) {
    params.push(positiveInt(req.query.module_id, 'module_id'));
    filters.push(`l.module_id = $${params.length}`);
  }
  if (req.query.status) {
    params.push(enumValue(req.query.status, 'status', ['not_started', 'in_progress', 'completed']));
    filters.push(`COALESCE(p.status, 'not_started') = $${params.length}`);
  }
  if (req.query.difficulty) {
    params.push(enumValue(req.query.difficulty, 'difficulty', ['debutant', 'intermediaire', 'avance']));
    filters.push(`l.difficulty = $${params.length}`);
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const result = await db.query(`
    SELECT l.*, m.name AS module_name,
      COALESCE(p.status, 'not_started') AS status,
      COALESCE(array_length(p.completed_step_ids, 1), 0)::int AS completed_steps,
      COUNT(s.id)::int AS total_steps
    FROM labs l
    JOIN modules m ON m.id = l.module_id
    LEFT JOIN user_lab_progress p ON p.lab_id = l.id
    LEFT JOIN lab_steps s ON s.lab_id = l.id
    ${where}
    GROUP BY l.id, m.name, p.status, p.completed_step_ids
    ORDER BY m.id, l.id
  `, params);
  res.json(result.rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = positiveInt(req.params.id, 'id');
  const labResult = await db.query(`
    SELECT l.*, m.name AS module_name, m.description AS module_description,
      COALESCE(p.status, 'not_started') AS status,
      COALESCE(p.completed_step_ids, ARRAY[]::integer[]) AS completed_step_ids,
      COALESCE(p.personal_notes, '') AS personal_notes
    FROM labs l
    JOIN modules m ON m.id = l.module_id
    LEFT JOIN user_lab_progress p ON p.lab_id = l.id
    WHERE l.id = $1
  `, [id]);

  if (labResult.rowCount === 0) throw notFound('Lab not found');

  const stepsResult = await db.query(
    'SELECT * FROM lab_steps WHERE lab_id = $1 ORDER BY step_order',
    [id],
  );

  res.json({ ...labResult.rows[0], steps: stepsResult.rows });
}));

router.post('/', asyncHandler(async (req, res) => {
  const moduleId = positiveInt(req.body.module_id, 'module_id');
  const title = requiredString(req.body.title, 'title', 160);
  const slug = requiredString(req.body.slug, 'slug', 180);
  const objective = requiredString(req.body.objective, 'objective', 4000);
  const prerequisites = optionalString(req.body.prerequisites, 'prerequisites', 4000);
  const difficulty = enumValue(req.body.difficulty, 'difficulty', ['debutant', 'intermediaire', 'avance']);
  const estimatedMinutes = positiveInt(req.body.estimated_minutes, 'estimated_minutes');
  const azureServices = stringArray(req.body.azure_services, 'azure_services');
  const commonPitfalls = stringArray(req.body.common_pitfalls, 'common_pitfalls');
  const understandingGoals = stringArray(req.body.understanding_goals, 'understanding_goals');
  const verificationSteps = stringArray(req.body.verification_steps, 'verification_steps');
  const usefulCommands = Array.isArray(req.body.useful_commands) ? req.body.useful_commands : [];

  const result = await db.query(`
    INSERT INTO labs (
      module_id, title, slug, objective, prerequisites, difficulty, estimated_minutes,
      azure_services, useful_commands, common_pitfalls, understanding_goals, verification_steps
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `, [
    moduleId,
    title,
    slug,
    objective,
    prerequisites,
    difficulty,
    estimatedMinutes,
    azureServices,
    JSON.stringify(usefulCommands),
    commonPitfalls,
    understandingGoals,
    verificationSteps,
  ]);

  await db.query('INSERT INTO user_lab_progress (lab_id) VALUES ($1) ON CONFLICT (lab_id) DO NOTHING', [result.rows[0].id]);
  res.status(201).json(result.rows[0]);
}));

router.patch('/:id/progress', asyncHandler(async (req, res) => {
  const id = positiveInt(req.params.id, 'id');
  const status = enumValue(req.body.status, 'status', ['not_started', 'in_progress', 'completed']);
  const personalNotes = optionalString(req.body.personal_notes, 'personal_notes', 10000);

  const result = await db.query(`
    INSERT INTO user_lab_progress (lab_id, status, personal_notes, last_opened_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    ON CONFLICT (lab_id)
    DO UPDATE SET status = EXCLUDED.status,
      personal_notes = EXCLUDED.personal_notes,
      last_opened_at = NOW(),
      updated_at = NOW()
    RETURNING *
  `, [id, status, personalNotes]);

  res.json(result.rows[0]);
}));

router.post('/:id/steps/:stepId/toggle', asyncHandler(async (req, res) => {
  const labId = positiveInt(req.params.id, 'id');
  const stepId = positiveInt(req.params.stepId, 'stepId');
  const stepResult = await db.query('SELECT id FROM lab_steps WHERE id = $1 AND lab_id = $2', [stepId, labId]);
  if (stepResult.rowCount === 0) throw notFound('Lab step not found');

  const result = await db.query(`
    INSERT INTO user_lab_progress (lab_id, status, completed_step_ids, updated_at)
    VALUES ($1, 'in_progress', ARRAY[$2]::integer[], NOW())
    ON CONFLICT (lab_id)
    DO UPDATE SET
      completed_step_ids = CASE
        WHEN $2 = ANY(user_lab_progress.completed_step_ids)
          THEN array_remove(user_lab_progress.completed_step_ids, $2)
        ELSE user_lab_progress.completed_step_ids || $2
      END,
      status = 'in_progress',
      updated_at = NOW()
    RETURNING *
  `, [labId, stepId]);

  res.json(result.rows[0]);
}));

module.exports = router;
