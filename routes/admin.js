const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const { validateRequest } = require('../middleware/validation');
const { TICKET_STATUS, TICKET_PRIORITY } = require('../constants/enums');
const { FLASH_KEYS, TICKET_MESSAGES, COMMENT_MESSAGES } = require('../constants/messages');
const { VALIDATION_MESSAGES } = require('../constants/validation');

router.use(requireAuth);

router.get('/dashboard', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      search: req.query.search
    };

    const tickets = await Ticket.findAll(filters);
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      tickets,
      filters
    });
  } catch (error) {
    next(error);
  }
});

router.get('/tickets/:id', async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    const comments = await Comment.findByTicketId(req.params.id);

    if (!ticket) {
      req.flash(FLASH_KEYS.ERROR, TICKET_MESSAGES.NOT_FOUND);
      return res.redirect('/admin/dashboard');
    }

    res.render('admin/ticket-detail', {
      title: `Ticket #${ticket.id}`,
      ticket,
      comments
    });
  } catch (error) {
    next(error);
  }
});

router.post('/tickets/:id/update', [
  body('status').optional().isIn(Object.values(TICKET_STATUS)).withMessage(VALIDATION_MESSAGES.STATUS_INVALID),
  body('priority').optional().isIn(Object.values(TICKET_PRIORITY)).withMessage(VALIDATION_MESSAGES.PRIORITY_INVALID)
], validateRequest, async (req, res, next) => {
  try {
    await Ticket.update(req.params.id, req.body);
    req.flash(FLASH_KEYS.SUCCESS, TICKET_MESSAGES.UPDATED);
    res.redirect(`/admin/tickets/${req.params.id}`);
  } catch (error) {
    next(error);
  }
});

router.post('/tickets/:id/comments', [
  body('content').trim().notEmpty().withMessage(VALIDATION_MESSAGES.COMMENT_REQUIRED)
], validateRequest, async (req, res, next) => {
  try {
    await Comment.create({
      ticket_id: req.params.id,
      user_id: req.session.user.id,
      content: req.body.content,
      is_internal: req.body.is_internal === 'true'
    });

    req.flash(FLASH_KEYS.SUCCESS, COMMENT_MESSAGES.ADDED);
    res.redirect(`/admin/tickets/${req.params.id}`);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
