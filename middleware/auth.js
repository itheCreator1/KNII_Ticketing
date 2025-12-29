const { AUTH_MESSAGES } = require('../constants/messages');
const { USER_ROLE } = require('../constants/enums');
const { errorRedirect } = require('../utils/responseHelpers');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return errorRedirect(req, res, AUTH_MESSAGES.UNAUTHORIZED, '/auth/login');
  }

  try {
    // Check if user is still active (in case status changed after login)
    const user = await User.findById(req.session.user.id);

    if (!user || user.status !== 'active') {
      return new Promise((resolve) => {
        req.session.destroy((err) => {
          if (err) console.error('Session destruction error:', err);
          res.redirect('/auth/login');
          resolve();
        });
      });
    }

    next();
  } catch (err) {
    console.error('Auth check error:', err);
    return res.redirect('/auth/login');
  }
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return errorRedirect(req, res, AUTH_MESSAGES.UNAUTHORIZED, '/auth/login');
  }

  const adminRoles = [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN];
  if (!adminRoles.includes(req.session.user.role)) {
    return errorRedirect(req, res, AUTH_MESSAGES.FORBIDDEN, '/admin/dashboard');
  }

  next();
}

function requireSuperAdmin(req, res, next) {
  if (!req.session.user) {
    return errorRedirect(req, res, AUTH_MESSAGES.UNAUTHORIZED, '/auth/login');
  }

  if (req.session.user.role !== USER_ROLE.SUPER_ADMIN) {
    return errorRedirect(req, res, 'Super admin access required', '/admin/dashboard');
  }

  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireSuperAdmin
};
