/**
 * Component Tester Routes
 *
 * Development/Staging only route for visual validation and documentation of UI components.
 * NOT available in production environment.
 *
 * Endpoint:
 * - GET /test-components - Component showcase and API documentation page
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

/**
 * Component Tester Page
 * GET /test-components
 *
 * Displays all badge and form components with:
 * - Visual showcase of each component
 * - All parameter variations
 * - API documentation with usage examples
 * - Design token validation
 *
 * Authentication: Required (must be logged in)
 * Environment: Development and staging only (not production)
 */
router.get('/test-components', requireAuth, (req, res) => {
  res.render('test-components', {
    title: 'Component Tester - KNII Ticketing System',
  });
});

module.exports = router;
