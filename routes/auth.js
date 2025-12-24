const express = require('express');
const router = express.Router();
const { validateRequest } = require('../middleware/validation');
const { FLASH_KEYS, AUTH_MESSAGES } = require('../constants/messages');
const authService = require('../services/authService');
const { validateLogin } = require('../validators/authValidators');

router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/admin/dashboard');
  }
  res.render('auth/login', { title: 'Admin Login' });
});

router.post('/login', validateLogin, validateRequest, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await authService.authenticate(username, password);

    if (!user) {
      req.flash(FLASH_KEYS.ERROR, AUTH_MESSAGES.LOGIN_FAILED);
      return res.redirect('/auth/login');
    }

    req.session.user = authService.createSessionData(user);

    req.flash(FLASH_KEYS.SUCCESS, AUTH_MESSAGES.LOGIN_SUCCESS);
    res.redirect('/admin/dashboard');
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/admin/dashboard');
    }
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

module.exports = router;
