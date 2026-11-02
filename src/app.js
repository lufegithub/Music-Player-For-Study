const path = require('path');
const express = require('express');

const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { formatDuration } = require('./utils/format');

const app = express();

// View engine (camada View do MVC)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Helpers disponíveis em todas as views
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.formatDuration = formatDuration;
  next();
});

app.use(routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
