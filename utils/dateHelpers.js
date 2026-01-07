/**
 * Date Helper Utilities
 * Provides functions for calculating and formatting ticket ages
 */

/**
 * Calculate human-readable age from timestamp with color coding
 * @param {Date|string} timestamp - Created timestamp
 * @returns {Object} { text: '2 days old', colorClass: 'badge bg-info' }
 */
function calculateTicketAge(timestamp) {
  const now = new Date();
  const created = new Date(timestamp);
  const diffMs = now - created;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  let text, colorClass;

  if (diffHours < 24) {
    text = 'New';
    colorClass = 'badge bg-success';
  } else if (diffDays <= 3) {
    text = `${diffDays} day${diffDays > 1 ? 's' : ''} old`;
    colorClass = 'badge bg-info';
  } else if (diffDays <= 7) {
    text = `${diffDays} days old`;
    colorClass = 'badge bg-warning';
  } else {
    const weeks = Math.floor(diffDays / 7);
    text = `${weeks} week${weeks > 1 ? 's' : ''} old`;
    colorClass = 'badge bg-danger';
  }

  return { text, colorClass };
}

module.exports = { calculateTicketAge };
