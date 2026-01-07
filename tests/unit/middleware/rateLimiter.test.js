/**
 * Rate Limiter Middleware Unit Tests
 *
 * Tests rate limiting middleware export:
 * - loginLimiter - exported as middleware function
 *
 * NOTE: Detailed rate limiting behavior (10 attempts per 15 minutes, etc.)
 * is tested in integration tests where we can actually trigger rate limits.
 * These unit tests verify only that the middleware is properly exported.
 */

const { loginLimiter } = require('../../../middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  describe('loginLimiter', () => {
    it('should export loginLimiter as a function', () => {
      // Assert
      expect(loginLimiter).toBeDefined();
      expect(typeof loginLimiter).toBe('function');
    });

    it('should be an express middleware with 3 parameters', () => {
      // Assert - Express middleware signature: (req, res, next)
      expect(loginLimiter.length).toBe(3);
    });
  });
});
