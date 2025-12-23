const { FLASH_KEYS, AUTH_MESSAGES } = require('../constants/messages');
const { USER_ROLE } = require('../constants/enums');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    req.flash(FLASH_KEYS.ERROR, AUTH_MESSAGES.UNAUTHORIZED);
    return res.redirect('/auth/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== USER_ROLE.ADMIN) {
    req.flash(FLASH_KEYS.ERROR, AUTH_MESSAGES.FORBIDDEN);
    return res.redirect('/admin/dashboard');
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin
};
