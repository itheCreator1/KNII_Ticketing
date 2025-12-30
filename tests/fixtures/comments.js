/**
 * Comment Test Fixtures
 *
 * Static test data for comments. Use these for reference data that doesn't
 * need to be unique (e.g., testing validation rules).
 */

module.exports = {
  validPublicComment: {
    ticket_id: 1,
    user_id: 1,
    content: 'This is a public comment visible to everyone.',
    is_internal: false
  },

  validInternalComment: {
    ticket_id: 1,
    user_id: 1,
    content: 'This is an internal comment only visible to admins.',
    is_internal: true
  },

  longComment: {
    ticket_id: 1,
    user_id: 1,
    content: 'This is a longer comment with more detailed information about the issue. It contains multiple sentences and provides comprehensive context about the problem being discussed. This helps demonstrate how the system handles longer form content.',
    is_internal: false
  },

  // Invalid content (for validation testing)
  invalidContent: [
    '',                           // Empty
    '   ',                        // Only whitespace
    'a'.repeat(2001),             // Exceeds MAX_LENGTHS.COMMENT_CONTENT (2000)
    null,
    undefined
  ],

  // Invalid is_internal values
  invalidIsInternal: [
    'yes',
    'no',
    1,
    0,
    null,
    undefined,
    {}
  ]
};
