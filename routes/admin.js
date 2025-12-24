const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Comment = require('../models/Comment');
const { validateRequest } = require('../middleware/validation');
const { FLASH_KEYS, TICKET_MESSAGES, COMMENT_MESSAGES } = require('../constants/messages');
const ticketService = require('../services/ticketService');
const { validateTicketUpdate } = require('../validators/ticketValidators');
const { validateCommentCreation } = require('../validators/commentValidators');

router.use(requireAuth);

router.get('/dashboard', async (req, res, next) => {
  try {
    const tickets = await ticketService.getAllTickets(req.query);
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      tickets,
      filters: req.query
    });
  } catch (error) {
    next(error);
  }
});

router.get('/tickets/:id', async (req, res, next) => {
  try {
    const ticket = await ticketService.getTicketById(req.params.id);
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

router.post('/tickets/:id/update', validateTicketUpdate, validateRequest, async (req, res, next) => {
  try {
    await ticketService.updateTicket(req.params.id, req.body);
    req.flash(FLASH_KEYS.SUCCESS, TICKET_MESSAGES.UPDATED);
    res.redirect(`/admin/tickets/${req.params.id}`);
  } catch (error) {
    next(error);
  }
});

router.post('/tickets/:id/comments', validateCommentCreation, validateRequest, async (req, res, next) => {
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
