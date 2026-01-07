/**
 * Public Routes Integration Tests
 *
 * Tests public-facing routes:
 * - GET / - Redirects to login page (no more anonymous submissions)
 * - GET /health - Health check endpoint
 *
 * Uses transaction-based isolation for test data cleanup.
 */

const request = require('supertest');
const app = require('../../../app');
const { setupTestDatabase, teardownTestDatabase } = require('../../helpers/database');

describe('Public Routes Integration Tests', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  describe('GET /', () => {
    it('should redirect to login page', async () => {
      // Act
      const response = await request(app)
        .get('/');

      // Assert
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/auth/login');
    });
  });

  describe('GET /health', () => {
    it('should return 200 status with health information', async () => {
      // Act
      const response = await request(app)
        .get('/health');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
      expect(response.body.environment).toBeDefined();
    });

    it('should include database status', async () => {
      // Act
      const response = await request(app)
        .get('/health');

      // Assert
      expect(response.body.database).toBeDefined();
      expect(response.body.database.status).toBe('connected');
      expect(response.body.database.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should include memory usage information', async () => {
      // Act
      const response = await request(app)
        .get('/health');

      // Assert
      expect(response.body.memory).toBeDefined();
      expect(response.body.memory.heapUsed).toContain('MB');
      expect(response.body.memory.heapTotal).toContain('MB');
    });

    it('should return JSON format', async () => {
      // Act
      const response = await request(app)
        .get('/health');

      // Assert
      expect(response.headers['content-type']).toContain('application/json');
      expect(typeof response.body).toBe('object');
    });
  });
});
