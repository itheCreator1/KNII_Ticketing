/**
 * Jest Environment Setup (runs BEFORE test framework initialization)
 *
 * This file MUST run before any test files load to ensure NODE_ENV=test
 * is set before app.js is imported.
 *
 * Why this matters:
 * - Docker container runs with NODE_ENV=development
 * - Test files would load app.js with production CSRF enabled
 * - setupFilesAfterEnv runs too late (after app.js is loaded)
 * - setupFiles runs BEFORE test framework initialization (correct timing)
 */

// Force NODE_ENV to 'test' (overrides container's 'development' setting)
process.env.NODE_ENV = 'test';

// Load test environment variables with override to ensure .env.test values take precedence
require('dotenv').config({ path: '.env.test', override: true });

// Suppress logging during tests
process.env.LOG_LEVEL = 'error';

// Set language to English for tests (prevents i18n defaulting to Greek)
process.env.I18N_DEFAULTLANGUAGE = 'en';
