const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const dashboardRoutes = require('./routes/dashboard');
const moduleRoutes = require('./routes/modules');
const labRoutes = require('./routes/labs');
const quizRoutes = require('./routes/quiz');
const noteRoutes = require('./routes/notes');
const resourceRoutes = require('./routes/resources');
const adminRoutes = require('./routes/admin');
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

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, host, () => {
  console.log(`AZ-104 Lab Coach running at http://${host}:${port}`);
});
