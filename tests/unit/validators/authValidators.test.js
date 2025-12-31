/**
 * Auth Validators Unit Tests
 *
 * Tests the authentication validation middleware using express-validator.
 * Covers the validateLogin validator with valid and invalid inputs.
 */

const { validationResult } = require('express-validator');
const { validateLogin } = require('../../../validators/authValidators');
const { createMockRequest } = require('../../helpers/mocks');

/**
 * Helper function to run validators and collect errors
 */
async function runValidators(validators, req) {
  for (const validator of validators) {
    await validator.run(req);
  }
  return validationResult(req);
}

describe('Auth Validators', () => {
  describe('validateLogin', () => {
    it('should pass validation for valid login credentials', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          username: 'validuser',
          password: 'ValidPass123!'
        }
      });

      // Act
      const result = await runValidators(validateLogin, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when username is missing', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          password: 'ValidPass123!'
        }
      });

      // Act
      const result = await runValidators(validateLogin, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'username')).toBe(true);
    });

    it('should fail when username is empty string', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          username: '',
          password: 'ValidPass123!'
        }
      });

      // Act
      const result = await runValidators(validateLogin, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'username')).toBe(true);
    });

    it('should fail when username is only whitespace', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          username: '   ',
          password: 'ValidPass123!'
        }
      });

      // Act
      const result = await runValidators(validateLogin, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'username')).toBe(true);
    });

    it('should fail when password is missing', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          username: 'validuser'
        }
      });

      // Act
      const result = await runValidators(validateLogin, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'password')).toBe(true);
    });

    it('should fail when password is empty string', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          username: 'validuser',
          password: ''
        }
      });

      // Act
      const result = await runValidators(validateLogin, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'password')).toBe(true);
    });

    it('should fail when both username and password are missing', async () => {
      // Arrange
      const req = createMockRequest({
        body: {}
      });

      // Act
      const result = await runValidators(validateLogin, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'username')).toBe(true);
      expect(errors.some(e => e.path === 'password')).toBe(true);
    });

    it('should trim whitespace from username', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          username: '  validuser  ',
          password: 'ValidPass123!'
        }
      });

      // Act
      const result = await runValidators(validateLogin, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
      expect(req.body.username).toBe('validuser');
    });

    it('should not trim password (preserve exact input)', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          username: 'validuser',
          password: '  password  '
        }
      });

      // Act
      const result = await runValidators(validateLogin, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
      expect(req.body.password).toBe('  password  ');
    });

    it('should accept any non-empty password (no complexity check at login)', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          username: 'validuser',
          password: 'simple'
        }
      });

      // Act
      const result = await runValidators(validateLogin, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should accept special characters in username and password', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          username: 'user_name123',
          password: 'P@ssw0rd!#$%'
        }
      });

      // Act
      const result = await runValidators(validateLogin, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });
  });
});
