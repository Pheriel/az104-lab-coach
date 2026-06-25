const { AppError } = require('../utils/errors');

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const isKnown = error instanceof AppError;
  const dbMessage = getDatabaseMessage(error);
  const statusCode = isKnown ? error.statusCode : dbMessage ? 503 : 500;

  if (!isKnown && !dbMessage) {
    console.error(error);
  } else if (dbMessage) {
    console.error(error);
  }

  res.status(statusCode).json({
    error: isKnown ? error.message : dbMessage || 'Internal server error',
    details: isKnown ? error.details : null,
  });
}

function getDatabaseMessage(error) {
  if (!error) return null;
  if (error.code === '28P01') {
    return 'PostgreSQL authentication failed. Check DATABASE_URL in .env.';
  }
  if (error.code === '3D000') {
    return 'PostgreSQL database does not exist. Create it, then run npm run db:reset.';
  }
  if (error.code === '42P01') {
    return 'PostgreSQL schema is missing. Run npm run db:reset.';
  }
  if (error.code === 'ECONNREFUSED') {
    return 'PostgreSQL is not reachable. Start PostgreSQL and check DATABASE_URL in .env.';
  }
  return null;
}

module.exports = { errorHandler, notFoundHandler };
