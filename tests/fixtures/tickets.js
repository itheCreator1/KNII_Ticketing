/**
 * Ticket Test Fixtures
 *
 * Static test data for tickets. Use these for reference data that doesn't
 * need to be unique (e.g., testing validation rules).
 */

module.exports = {
  validTicket: {
    title: 'Valid Test Ticket',
    description: 'This is a valid ticket description with adequate detail.',
    reporter_name: 'John Doe',
    reporter_email: 'john.doe@example.com',
    reporter_phone: '+1234567890',
    priority: 'medium',
    status: 'open'
  },

  urgentTicket: {
    title: 'Urgent Production Issue',
    description: 'Production system is down and users cannot access the application.',
    reporter_name: 'Jane Smith',
    reporter_email: 'jane.smith@example.com',
    reporter_phone: '+1987654321',
    priority: 'critical',
    status: 'open'
  },

  closedTicket: {
    title: 'Resolved Issue',
    description: 'This issue has been resolved and closed.',
    reporter_name: 'Bob Johnson',
    reporter_email: 'bob.johnson@example.com',
    priority: 'low',
    status: 'closed'
  },

  // Valid status values
  validStatuses: ['open', 'in_progress', 'closed'],

  // Invalid status values
  invalidStatuses: ['pending', 'archived', 'resolved', '', null, undefined, 123],

  // Valid priority values
  validPriorities: ['low', 'medium', 'high', 'critical'],

  // Invalid priority values
  invalidPriorities: ['urgent', 'normal', '', null, undefined, 123],

  // Invalid titles (for validation testing)
  invalidTitles: [
    '',                           // Empty
    'a',                          // Too short
    'a'.repeat(201),              // Exceeds MAX_LENGTHS.TICKET_TITLE (200)
    null,
    undefined
  ],

  // Invalid descriptions (for validation testing)
  invalidDescriptions: [
    '',                           // Empty
    'a'.repeat(5001),             // Exceeds MAX_LENGTHS.TICKET_DESCRIPTION (5000)
    null,
    undefined
  ],

  // Invalid emails (for validation testing)
  invalidEmails: [
    'not-an-email',
    '@example.com',
    'user@',
    'user @example.com',
    '',
    null,
    undefined
  ]
};
