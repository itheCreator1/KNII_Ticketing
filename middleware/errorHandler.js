const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Error handler caught exception', {
    error: err.message,
    stack: err.stack,
    status: err.status,
    url: req.url,
    method: req.method
  });

  const status = err.status || 500;
  const message = err.message || 'Something went wrong';

  if (req.accepts('html')) {
    res.status(status).render('errors/500', {
      title: 'Error',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message
    });
  } else {
    res.status(status).json({
      error: {
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message
      }
    });
  }
}

module.exports = errorHandler;
