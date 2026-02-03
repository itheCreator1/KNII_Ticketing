/**
 * Mock Object Factories
 *
 * Provides reusable mock objects for unit tests.
 * These mocks simulate Express req/res, database pools, and other dependencies.
 */

/**
 * Create a mock PostgreSQL Pool object
 * @returns {Object} Mock pool with query, connect, and end methods
 */
function createMockPool() {
  return {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
}

/**
 * Create a mock Express request object
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock request object
 */
function createMockRequest(overrides = {}) {
  return {
    session: {},
    flash: jest.fn(),
    body: {},
    params: {},
    query: {},
    headers: {},
    ip: '127.0.0.1',
    get: jest.fn(),
    ...overrides,
  };
}

/**
 * Create a mock Express response object
 * @returns {Object} Mock response object with chainable methods
 */
function createMockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.locals = {};
  return res;
}

/**
 * Create a mock Express next function
 * @returns {Function} Mock next function
 */
function createMockNext() {
  return jest.fn();
}

/**
 * Create a mock Winston logger
 * @returns {Object} Mock logger with info/warn/error/debug methods
 */
function createMockLogger() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
}

/**
 * Create a mock session object
 * @param {Object} user - User object to include in session
 * @returns {Object} Mock session object
 */
function createMockSession(user = null) {
  return {
    user: user,
    destroy: jest.fn((callback) => callback && callback()),
  };
}

/**
 * Create a mock validation result from express-validator
 * @param {Array} errors - Array of validation errors
 * @returns {Object} Mock validationResult
 */
function createMockValidationResult(errors = []) {
  return {
    isEmpty: jest.fn(() => errors.length === 0),
    array: jest.fn(() => errors),
    mapped: jest.fn(() => {
      const mapped = {};
      errors.forEach((err) => {
        mapped[err.param] = err;
      });
      return mapped;
    }),
  };
}

module.exports = {
  createMockPool,
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockLogger,
  createMockSession,
  createMockValidationResult,
};
