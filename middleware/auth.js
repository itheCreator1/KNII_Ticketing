function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    req.flash('error_msg', 'Please log in to access this page');
    return res.redirect('/auth/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error_msg', 'You do not have permission to access this page');
    return res.redirect('/admin/dashboard');
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin
};
