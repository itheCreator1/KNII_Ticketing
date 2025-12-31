/**
 * Response Helpers Unit Tests
 *
 * Tests the response helper utilities for flashing messages and redirecting.
 * Covers all 3 functions with success and edge cases.
 */

const { flashAndRedirect, successRedirect, errorRedirect } = require('../../../utils/responseHelpers');
const { FLASH_KEYS } = require('../../../constants/messages');
const { createMockRequest, createMockResponse } = require('../../helpers/mocks');

describe('Response Helpers', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
  });

  describe('flashAndRedirect', () => {
    it('should flash message with specified type and redirect', () => {
      // Arrange
      const flashType = 'test_type';
      const message = 'Test message';
      const redirectPath = '/test/path';

      // Act
      flashAndRedirect(mockReq, mockRes, flashType, message, redirectPath);

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith(flashType, message);
      expect(mockReq.flash).toHaveBeenCalledTimes(1);
      expect(mockRes.redirect).toHaveBeenCalledWith(redirectPath);
      expect(mockRes.redirect).toHaveBeenCalledTimes(1);
    });

    it('should handle success flash type', () => {
      // Arrange
      const message = 'Success message';
      const path = '/success';

      // Act
      flashAndRedirect(mockReq, mockRes, FLASH_KEYS.SUCCESS, message, path);

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith(FLASH_KEYS.SUCCESS, message);
      expect(mockRes.redirect).toHaveBeenCalledWith(path);
    });

    it('should handle error flash type', () => {
      // Arrange
      const message = 'Error message';
      const path = '/error';

      // Act
      flashAndRedirect(mockReq, mockRes, FLASH_KEYS.ERROR, message, path);

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith(FLASH_KEYS.ERROR, message);
      expect(mockRes.redirect).toHaveBeenCalledWith(path);
    });

    it('should handle empty message', () => {
      // Arrange
      const message = '';
      const path = '/test';

      // Act
      flashAndRedirect(mockReq, mockRes, 'info', message, path);

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith('info', '');
      expect(mockRes.redirect).toHaveBeenCalledWith(path);
    });

    it('should handle root path redirect', () => {
      // Arrange
      const message = 'Redirecting to root';

      // Act
      flashAndRedirect(mockReq, mockRes, 'info', message, '/');

      // Assert
      expect(mockRes.redirect).toHaveBeenCalledWith('/');
    });

    it('should handle complex redirect paths', () => {
      // Arrange
      const message = 'Redirecting to deep path';
      const path = '/admin/users/123/edit';

      // Act
      flashAndRedirect(mockReq, mockRes, 'info', message, path);

      // Assert
      expect(mockRes.redirect).toHaveBeenCalledWith(path);
    });
  });

  describe('successRedirect', () => {
    it('should flash success message and redirect', () => {
      // Arrange
      const message = 'Operation successful';
      const path = '/dashboard';

      // Act
      successRedirect(mockReq, mockRes, message, path);

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith(FLASH_KEYS.SUCCESS, message);
      expect(mockRes.redirect).toHaveBeenCalledWith(path);
    });

    it('should use success flash key constant', () => {
      // Arrange
      const message = 'User created successfully';
      const path = '/admin/users';

      // Act
      successRedirect(mockReq, mockRes, message, path);

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith('success_msg', message);
    });

    it('should handle multiple success redirects independently', () => {
      // Act
      successRedirect(mockReq, mockRes, 'First success', '/path1');

      // Reset mocks
      mockReq.flash.mockClear();
      mockRes.redirect.mockClear();

      successRedirect(mockReq, mockRes, 'Second success', '/path2');

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith(FLASH_KEYS.SUCCESS, 'Second success');
      expect(mockRes.redirect).toHaveBeenCalledWith('/path2');
      expect(mockReq.flash).toHaveBeenCalledTimes(1);
    });

    it('should handle long success messages', () => {
      // Arrange
      const longMessage = 'This is a very long success message that contains a lot of information about the operation that was just completed successfully.';
      const path = '/test';

      // Act
      successRedirect(mockReq, mockRes, longMessage, path);

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith(FLASH_KEYS.SUCCESS, longMessage);
    });
  });

  describe('errorRedirect', () => {
    it('should flash error message and redirect', () => {
      // Arrange
      const message = 'Operation failed';
      const path = '/error-page';

      // Act
      errorRedirect(mockReq, mockRes, message, path);

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith(FLASH_KEYS.ERROR, message);
      expect(mockRes.redirect).toHaveBeenCalledWith(path);
    });

    it('should use error flash key constant', () => {
      // Arrange
      const message = 'User creation failed';
      const path = '/admin/users/new';

      // Act
      errorRedirect(mockReq, mockRes, message, path);

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith('error_msg', message);
    });

    it('should handle multiple error redirects independently', () => {
      // Act
      errorRedirect(mockReq, mockRes, 'First error', '/path1');

      // Reset mocks
      mockReq.flash.mockClear();
      mockRes.redirect.mockClear();

      errorRedirect(mockReq, mockRes, 'Second error', '/path2');

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith(FLASH_KEYS.ERROR, 'Second error');
      expect(mockRes.redirect).toHaveBeenCalledWith('/path2');
      expect(mockReq.flash).toHaveBeenCalledTimes(1);
    });

    it('should handle technical error messages', () => {
      // Arrange
      const message = 'Database connection failed: ECONNREFUSED';
      const path = '/login';

      // Act
      errorRedirect(mockReq, mockRes, message, path);

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith(FLASH_KEYS.ERROR, message);
      expect(mockRes.redirect).toHaveBeenCalledWith(path);
    });

    it('should redirect back to form on validation error', () => {
      // Arrange
      const message = 'Please fill in all required fields';
      const path = '/admin/tickets/1/edit';

      // Act
      errorRedirect(mockReq, mockRes, message, path);

      // Assert
      expect(mockRes.redirect).toHaveBeenCalledWith(path);
    });
  });
});
