/**
 * Database Test Helpers
 *
 * Provides utilities for managing test database state using transaction-based isolation.
 * Each test runs within a transaction that is rolled back after completion, ensuring
 * complete isolation and fast test execution.
 */

const pool = require('../../config/database');

/**
 * Begin a database transaction for test isolation
 * Call this in beforeEach() hooks
 */
async function setupTestDatabase() {
  await pool.query('BEGIN');
}

/**
 * Rollback the current transaction to clean up test data
 * Call this in afterEach() hooks
 */
async function teardownTestDatabase() {
  await pool.query('ROLLBACK');
}

/**
 * Delete all rows from a specific table
 * Use this when you need explicit cleanup (not common with transaction rollback)
 * @param {string} tableName - Name of the table to clean
 */
async function cleanTable(tableName) {
  await pool.query(`DELETE FROM ${tableName}`);
}

/**
 * Delete all rows from all tables in the correct order to respect FK constraints
 * Order: audit_logs, comments, tickets, session, users
 */
async function cleanAllTables() {
  await pool.query('DELETE FROM audit_logs');
  await pool.query('DELETE FROM comments');
  await pool.query('DELETE FROM tickets');
  await pool.query('DELETE FROM session');
  await pool.query('DELETE FROM users');
}

/**
 * Reset auto-increment sequences for all tables
 * Useful when you need predictable IDs in tests
 */
async function resetSequences() {
  await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
  await pool.query('ALTER SEQUENCE tickets_id_seq RESTART WITH 1');
  await pool.query('ALTER SEQUENCE comments_id_seq RESTART WITH 1');
  await pool.query('ALTER SEQUENCE audit_logs_id_seq RESTART WITH 1');
}

module.exports = {
  setupTestDatabase,
  teardownTestDatabase,
  cleanTable,
  cleanAllTables,
  resetSequences
};
