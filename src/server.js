const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const publicDir = path.join(__dirname, '..', 'public');
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
let db;

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(publicDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'dashboard.html'));
});

app.get('/health', (req, res) => {
  res.json({ ok: true, app: 'az104-lab-coach' });
});

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT NOW();');
    res.json({
      status: 'ok',
      database: 'connected',
      node: process.version,
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: error.message,
    });
  }
});

async function start() {
  try {
    db = require('./db');
  } catch (error) {
    process.exit(1);
  }

  try {
    await db.testConnection();
  } catch (error) {
    console.error('[DB] Server will start, but database-backed routes may fail until PostgreSQL is available.');
  }

  app.use('/api/dashboard', require('./routes/dashboard'));
  app.use('/api/modules', require('./routes/modules'));
  app.use('/api/labs', require('./routes/labs'));
  app.use('/api/quiz', require('./routes/quiz'));
  app.use('/api/notes', require('./routes/notes'));
  app.use('/api/resources', require('./routes/resources'));
  app.use('/api/admin', require('./routes/admin'));

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(port, host, () => {
    console.log(`AZ-104 Lab Coach running at http://${host}:${port}`);
  });
}

start();
