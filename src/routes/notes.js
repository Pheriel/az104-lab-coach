const express = require('express');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { requiredString, optionalString, positiveInt, stringArray } = require('../utils/validators');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT n.*, m.name AS module_name
    FROM notes n
    LEFT JOIN modules m ON m.id = n.module_id
    ORDER BY n.updated_at DESC
  `);
  res.json(result.rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  const moduleId = req.body.module_id ? positiveInt(req.body.module_id, 'module_id') : null;
  const title = requiredString(req.body.title, 'title', 160);
  const content = requiredString(req.body.content, 'content', 10000);
  const tags = stringArray(req.body.tags, 'tags');

  const result = await db.query(`
    INSERT INTO notes (module_id, title, content, tags)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [moduleId, title, content, tags]);

  res.status(201).json(result.rows[0]);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = positiveInt(req.params.id, 'id');
  const moduleId = req.body.module_id ? positiveInt(req.body.module_id, 'module_id') : null;
  const title = requiredString(req.body.title, 'title', 160);
  const content = requiredString(req.body.content, 'content', 10000);
  const tags = stringArray(req.body.tags, 'tags');

  const result = await db.query(`
    UPDATE notes
    SET module_id = $1, title = $2, content = $3, tags = $4, updated_at = NOW()
    WHERE id = $5
    RETURNING *
  `, [moduleId, title, content, tags, id]);

  res.json(result.rows[0]);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = positiveInt(req.params.id, 'id');
  await db.query('DELETE FROM notes WHERE id = $1', [id]);
  res.status(204).end();
}));

module.exports = router;
