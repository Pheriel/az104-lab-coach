const express = require('express');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { badRequest } = require('../utils/errors');
const { positiveInt, requiredString, enumValue } = require('../utils/validators');

const router = express.Router();

router.get('/questions', asyncHandler(async (req, res) => {
  const params = [];
  let where = '';
  if (req.query.module_id) {
    params.push(positiveInt(req.query.module_id, 'module_id'));
    where = 'WHERE q.module_id = $1';
  }

  const result = await db.query(`
    SELECT q.id, q.module_id, m.name AS module_name, q.question, q.choices, q.difficulty
    FROM quiz_questions q
    JOIN modules m ON m.id = q.module_id
    ${where}
    ORDER BY q.module_id, q.id
  `, params);
  res.json(result.rows);
}));

router.post('/questions', asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body.choices) || req.body.choices.length < 2) {
    throw badRequest('choices must contain at least two answers');
  }
  const correctAnswer = Number(req.body.correct_answer);
  if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= req.body.choices.length) {
    throw badRequest('correct_answer must match one of the choices');
  }

  const result = await db.query(`
    INSERT INTO quiz_questions (module_id, question, choices, correct_answer, explanation, difficulty)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [
    positiveInt(req.body.module_id, 'module_id'),
    requiredString(req.body.question, 'question', 4000),
    JSON.stringify(req.body.choices),
    correctAnswer,
    requiredString(req.body.explanation, 'explanation', 4000),
    enumValue(req.body.difficulty || 'intermediaire', 'difficulty', ['debutant', 'intermediaire', 'avance']),
  ]);
  res.status(201).json(result.rows[0]);
}));

router.post('/attempts', asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body.answers) || req.body.answers.length === 0) {
    throw badRequest('answers must be a non-empty array');
  }

  const ids = req.body.answers.map((answer) => positiveInt(answer.question_id, 'question_id'));
  const questionResult = await db.query(
    'SELECT id, module_id, correct_answer, explanation FROM quiz_questions WHERE id = ANY($1::int[])',
    [ids],
  );

  const questions = new Map(questionResult.rows.map((question) => [question.id, question]));
  let score = 0;
  const reviewed = req.body.answers.map((answer) => {
    const question = questions.get(Number(answer.question_id));
    if (!question) throw badRequest(`Question ${answer.question_id} does not exist`);
    const selected = Number(answer.selected_answer);
    const correct = selected === question.correct_answer;
    if (correct) score += 1;
    return {
      question_id: question.id,
      selected_answer: selected,
      correct_answer: question.correct_answer,
      correct,
      explanation: question.explanation,
    };
  });

  const moduleId = req.body.module_id ? positiveInt(req.body.module_id, 'module_id') : questionResult.rows[0]?.module_id || null;
  const total = reviewed.length;
  const attemptResult = await db.query(`
    INSERT INTO quiz_attempts (module_id, score, total, answers)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [moduleId, score, total, JSON.stringify(reviewed)]);

  res.status(201).json({ attempt: attemptResult.rows[0], score, total, answers: reviewed });
}));

router.get('/attempts/recent', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT qa.*, m.name AS module_name
    FROM quiz_attempts qa
    LEFT JOIN modules m ON m.id = qa.module_id
    ORDER BY qa.created_at DESC
    LIMIT 8
  `);
  res.json(result.rows);
}));

module.exports = router;
