const express = require('express');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { requiredString, optionalString, positiveInt, enumValue } = require('../utils/validators');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT r.*, m.name AS module_name
    FROM resources r
    LEFT JOIN modules m ON m.id = r.module_id
    ORDER BY r.resource_type, r.title
  `);
  res.json(result.rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  const moduleId = req.body.module_id ? positiveInt(req.body.module_id, 'module_id') : null;
  const title = requiredString(req.body.title, 'title', 160);
  const url = optionalString(req.body.url, 'url', 1000) || null;
  const resourceType = enumValue(req.body.resource_type, 'resource_type', ['doc', 'commande', 'video', 'reference', 'outil']);
  const content = optionalString(req.body.content, 'content', 4000);

  const result = await db.query(`
    INSERT INTO resources (module_id, title, url, resource_type, content)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [moduleId, title, url, resourceType, content]);

  res.status(201).json(result.rows[0]);
}));

module.exports = router;
