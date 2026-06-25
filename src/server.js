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

async function start() {
  let db;
  try {
    db = require('./db');
    await db.testConnection();
  } catch (error) {
    process.exit(1);
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
