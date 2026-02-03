/**
 * Comment Validators Unit Tests
 *
 * Tests the comment validation middleware using express-validator.
 * Covers the validateCommentCreation validator with valid and invalid inputs.
 */

const { validationResult } = require('express-validator');
const { validateCommentCreation } = require('../../../validators/commentValidators');
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

describe('Comment Validators', () => {
  describe('validateCommentCreation', () => {
    it('should pass validation for valid comment content', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          content: 'This is a valid comment with sufficient detail.',
        },
      });

      // Act
      const result = await runValidators(validateCommentCreation, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should pass validation for short comment', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          content: 'OK',
        },
      });

      // Act
      const result = await runValidators(validateCommentCreation, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when content is missing', async () => {
      // Arrange
      const req = createMockRequest({
        body: {},
      });

      // Act
      const result = await runValidators(validateCommentCreation, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'content')).toBe(true);
    });

    it('should fail when content is empty string', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          content: '',
        },
      });

      // Act
      const result = await runValidators(validateCommentCreation, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'content')).toBe(true);
    });

    it('should fail when content is only whitespace', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          content: '   ',
        },
      });

      // Act
      const result = await runValidators(validateCommentCreation, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'content')).toBe(true);
    });

    it('should fail when content exceeds maximum length (2000 chars)', async () => {
      // Arrange
      const longContent = 'a'.repeat(2001); // MAX_LENGTHS.COMMENT_CONTENT is 2000
      const req = createMockRequest({
        body: {
          content: longContent,
        },
      });

      // Act
      const result = await runValidators(validateCommentCreation, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'content')).toBe(true);
    });

    it('should pass validation for content at maximum length', async () => {
      // Arrange
      const maxContent = 'a'.repeat(2000); // Exactly at the limit
      const req = createMockRequest({
        body: {
          content: maxContent,
        },
      });

      // Act
      const result = await runValidators(validateCommentCreation, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should trim whitespace from content', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          content: '  Valid comment content  ',
        },
      });

      // Act
      const result = await runValidators(validateCommentCreation, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
      expect(req.body.content).toBe('Valid comment content');
    });

    it('should accept content with special characters', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          content: 'Comment with special chars: !@#$%^&*()[]{}|\\:";\'<>?,./',
        },
      });

      // Act
      const result = await runValidators(validateCommentCreation, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should accept content with newlines', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          content: 'Line 1\nLine 2\nLine 3',
        },
      });

      // Act
      const result = await runValidators(validateCommentCreation, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should accept content with unicode characters', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          content: 'Comment with émojis 😀 and spëcial chârs',
        },
      });

      // Act
      const result = await runValidators(validateCommentCreation, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should accept content with HTML-like strings (not sanitized)', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          content: 'This looks like <strong>HTML</strong> but is just text',
        },
      });

      // Act
      const result = await runValidators(validateCommentCreation, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should accept content with URLs', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          content: 'Check this link: https://example.com/ticket/123',
        },
      });

      // Act
      const result = await runValidators(validateCommentCreation, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should accept content with code snippets', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          content: 'Error in code: if (x === null) { return; }',
        },
      });

      // Act
      const result = await runValidators(validateCommentCreation, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });
  });
});
