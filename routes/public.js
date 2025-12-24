const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { TICKET_PRIORITY } = require('../constants/enums');
const { FLASH_KEYS, TICKET_MESSAGES } = require('../constants/messages');
const { VALIDATION_MESSAGES } = require('../constants/validation');
const ticketService = require('../services/ticketService');

router.get('/', (req, res) => {
  res.render('public/submit-ticket', {
    title: 'Submit a Ticket',
    errors: []
  });
});

router.post('/submit-ticket', [
  body('title').trim().notEmpty().withMessage(VALIDATION_MESSAGES.TITLE_REQUIRED),
  body('description').trim().notEmpty().withMessage(VALIDATION_MESSAGES.DESCRIPTION_REQUIRED),
  body('reporter_email').isEmail().withMessage(VALIDATION_MESSAGES.EMAIL_INVALID),
  body('reporter_name').trim().notEmpty().withMessage(VALIDATION_MESSAGES.NAME_REQUIRED),
  body('priority').isIn(Object.values(TICKET_PRIORITY)).withMessage(VALIDATION_MESSAGES.PRIORITY_INVALID)
], validateRequest, async (req, res, next) => {
  try {
    const ticket = await ticketService.createTicket(req.body);
    req.flash(FLASH_KEYS.SUCCESS, TICKET_MESSAGES.CREATED);
    res.render('public/success', {
      title: 'Ticket Submitted',
      ticketId: ticket.id
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
