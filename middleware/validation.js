const { validationResult } = require('express-validator');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.accepts('html')) {
      errors.array().forEach(error => {
        req.flash('error_msg', error.msg);
      });
      return res.redirect('back');
    } else {
      return res.status(400).json({ errors: errors.array() });
    }
  }
  next();
}

/**
 * Middleware to parse and validate integer ID from route params
 * Converts req.params.id to integer and validates it's positive
 * Attaches parsed value to req.userId for use in route handlers
 */
function parseUserId(req, res, next) {
  const userId = parseInt(req.params.id);
  if (isNaN(userId) || userId < 1) {
    const error = new Error('Invalid user ID');
    error.status = 400;
    return next(error);
  }
  req.userId = userId;
  next();
}

module.exports = {
  validateRequest,
  parseUserId
};
