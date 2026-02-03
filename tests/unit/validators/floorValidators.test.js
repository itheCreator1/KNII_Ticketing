/**
 * Floor Validators Unit Tests
 *
 * Tests the floor validation middleware using express-validator.
 * Covers all 3 validator arrays with valid and invalid inputs.
 */

const { validationResult } = require('express-validator');
const {
  validateFloorId,
  validateFloorCreate,
  validateFloorUpdate,
} = require('../../../validators/floorValidators');
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

describe('Floor Validators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFloorId', () => {
    it('should pass validation for valid positive integer ID', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '1' },
      });

      // Act
      const result = await runValidators(validateFloorId, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should pass validation for large integer ID', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '9999' },
      });

      // Act
      const result = await runValidators(validateFloorId, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when ID is not an integer', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: 'invalid' },
      });

      // Act
      const result = await runValidators(validateFloorId, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'id')).toBe(true);
    });

    it('should fail when ID is zero', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '0' },
      });

      // Act
      const result = await runValidators(validateFloorId, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'id')).toBe(true);
    });

    it('should fail when ID is negative', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '-1' },
      });

      // Act
      const result = await runValidators(validateFloorId, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'id')).toBe(true);
    });

    it('should fail when ID is decimal', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '1.5' },
      });

      // Act
      const result = await runValidators(validateFloorId, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
    });

    it('should fail when ID is empty', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '' },
      });

      // Act
      const result = await runValidators(validateFloorId, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('validateFloorCreate', () => {
    it('should pass validation for valid floor name', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          name: 'Ground Floor',
          sort_order: 0,
        },
      });

      // Act
      const result = await runValidators(validateFloorCreate, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should pass validation with valid sort_order', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          name: '1st Floor',
          sort_order: 1,
        },
      });

      // Act
      const result = await runValidators(validateFloorCreate, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should pass validation without sort_order (optional)', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          name: 'Test Floor',
        },
      });

      // Act
      const result = await runValidators(validateFloorCreate, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should convert sort_order to integer', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          name: 'Test Floor',
          sort_order: '5',
        },
      });

      // Act
      await runValidators(validateFloorCreate, req);

      // Assert
      expect(typeof req.body.sort_order).toBe('number');
      expect(req.body.sort_order).toBe(5);
    });

    it('should fail when name is empty', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          name: '',
          sort_order: 0,
        },
      });

      // Act
      const result = await runValidators(validateFloorCreate, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'name')).toBe(true);
    });

    it('should fail when name is only whitespace', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          name: '   ',
          sort_order: 0,
        },
      });

      // Act
      const result = await runValidators(validateFloorCreate, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'name')).toBe(true);
    });

    it('should fail when name is too short (less than 2 chars)', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          name: 'A',
          sort_order: 0,
        },
      });

      // Act
      const result = await runValidators(validateFloorCreate, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'name')).toBe(true);
    });

    it('should fail when name exceeds 50 characters', async () => {
      // Arrange
      const longName = 'A'.repeat(51);
      const req = createMockRequest({
        body: {
          name: longName,
          sort_order: 0,
        },
      });

      // Act
      const result = await runValidators(validateFloorCreate, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'name')).toBe(true);
    });

    it('should accept name with exactly 2 characters', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          name: 'AB',
          sort_order: 0,
        },
      });

      // Act
      const result = await runValidators(validateFloorCreate, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should accept name with exactly 50 characters', async () => {
      // Arrange
      const fiftyCharName = 'A'.repeat(50);
      const req = createMockRequest({
        body: {
          name: fiftyCharName,
          sort_order: 0,
        },
      });

      // Act
      const result = await runValidators(validateFloorCreate, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should trim whitespace from name', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          name: '  Ground Floor  ',
          sort_order: 0,
        },
      });

      // Act
      await runValidators(validateFloorCreate, req);

      // Assert
      expect(req.body.name).toBe('Ground Floor');
    });

    it('should fail when sort_order is negative', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          name: 'Test Floor',
          sort_order: '-1',
        },
      });

      // Act
      const result = await runValidators(validateFloorCreate, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'sort_order')).toBe(true);
    });

    it('should fail when sort_order is decimal', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          name: 'Test Floor',
          sort_order: '1.5',
        },
      });

      // Act
      const result = await runValidators(validateFloorCreate, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
    });

    it('should accept sort_order as string that converts to integer', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          name: 'Test Floor',
          sort_order: '10',
        },
      });

      // Act
      const result = await runValidators(validateFloorCreate, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
      expect(req.body.sort_order).toBe(10);
    });

    it('should accept sort_order as 0', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          name: 'Ground Floor',
          sort_order: 0,
        },
      });

      // Act
      const result = await runValidators(validateFloorCreate, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('validateFloorUpdate', () => {
    it('should pass validation for valid name update', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '1' },
        body: { name: 'Updated Floor' },
      });

      // Act
      const result = await runValidators(validateFloorUpdate, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should pass validation for valid sort_order update', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '2' },
        body: { sort_order: 5 },
      });

      // Act
      const result = await runValidators(validateFloorUpdate, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should pass validation for active update', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '3' },
        body: { active: false },
      });

      // Act
      const result = await runValidators(validateFloorUpdate, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should pass validation for multiple field updates', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '4' },
        body: {
          name: 'Updated Floor',
          sort_order: 10,
          active: true,
        },
      });

      // Act
      const result = await runValidators(validateFloorUpdate, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should pass validation when no body fields provided (all optional)', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '5' },
        body: {},
      });

      // Act
      const result = await runValidators(validateFloorUpdate, req);

      // Assert
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when ID parameter is invalid', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: 'invalid' },
        body: { name: 'Updated Floor' },
      });

      // Act
      const result = await runValidators(validateFloorUpdate, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'id')).toBe(true);
    });

    it('should fail when name is too short (less than 2 chars)', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '1' },
        body: { name: 'A' },
      });

      // Act
      const result = await runValidators(validateFloorUpdate, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'name')).toBe(true);
    });

    it('should fail when name exceeds 50 characters', async () => {
      // Arrange
      const longName = 'A'.repeat(51);
      const req = createMockRequest({
        params: { id: '1' },
        body: { name: longName },
      });

      // Act
      const result = await runValidators(validateFloorUpdate, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'name')).toBe(true);
    });

    it('should fail when sort_order is negative', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '1' },
        body: { sort_order: '-1' },
      });

      // Act
      const result = await runValidators(validateFloorUpdate, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'sort_order')).toBe(true);
    });

    it('should fail when active is not boolean', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '1' },
        body: { active: 'invalid' },
      });

      // Act
      const result = await runValidators(validateFloorUpdate, req);

      // Assert
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.path === 'active')).toBe(true);
    });

    it('should convert active string to boolean', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '1' },
        body: { active: 'true' },
      });

      // Act
      await runValidators(validateFloorUpdate, req);

      // Assert
      expect(typeof req.body.active).toBe('boolean');
      expect(req.body.active).toBe(true);
    });

    it('should convert sort_order to integer', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '1' },
        body: { sort_order: '15' },
      });

      // Act
      await runValidators(validateFloorUpdate, req);

      // Assert
      expect(typeof req.body.sort_order).toBe('number');
      expect(req.body.sort_order).toBe(15);
    });

    it('should trim whitespace from name', async () => {
      // Arrange
      const req = createMockRequest({
        params: { id: '1' },
        body: { name: '  Updated Floor  ' },
      });

      // Act
      await runValidators(validateFloorUpdate, req);

      // Assert
      expect(req.body.name).toBe('Updated Floor');
    });
  });
});
