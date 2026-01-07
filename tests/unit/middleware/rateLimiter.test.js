/**
 * Rate Limiter Middleware Unit Tests
 *
 * Tests rate limiting configuration for:
 * - loginLimiter - 10 attempts per 15 minutes
 */

const { loginLimiter } = require('../../../middleware/rateLimiter');
const { createMockRequest, createMockResponse } = require('../../helpers/mocks');

describe('Rate Limiter Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginLimiter', () => {
    it('should have 15 minute window (900000ms)', () => {
      // Assert
      expect(loginLimiter.options.windowMs).toBe(15 * 60 * 1000);
      expect(loginLimiter.options.windowMs).toBe(900000);
    });

    it('should allow max 10 requests', () => {
      // Assert
      expect(loginLimiter.options.max).toBe(10);
    });

    it('should have appropriate error message', () => {
      // Assert
      expect(loginLimiter.options.message).toBe(
        'Too many login attempts from this IP, please try again after 15 minutes'
      );
    });

    it('should use standard headers and disable legacy headers', () => {
      // Assert
      expect(loginLimiter.options.standardHeaders).toBe(true);
      expect(loginLimiter.options.legacyHeaders).toBe(false);
    });

    it('should not skip successful requests', () => {
      // Assert
      expect(loginLimiter.options.skipSuccessfulRequests).toBe(false);
    });

    it('should not skip failed requests', () => {
      // Assert
      expect(loginLimiter.options.skipFailedRequests).toBe(false);
    });

    it('should have custom handler that redirects to /auth/login with flash message', () => {
      // Arrange
      const req = createMockRequest();
      const res = createMockResponse();

      // Act
      loginLimiter.options.handler(req, res);

      // Assert
      expect(req.flash).toHaveBeenCalledWith(
        'error_msg',
        'Too many login attempts. Please try again after 15 minutes.'
      );
      expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    });

    it('should count all requests regardless of success/failure', () => {
      // Assert
      expect(loginLimiter.options.skipSuccessfulRequests).toBe(false);
      expect(loginLimiter.options.skipFailedRequests).toBe(false);
    });
  });
});
