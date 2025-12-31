/**
 * AuditLog Model Unit Tests
 * Tests the AuditLog model in complete isolation with all dependencies mocked.
 * Covers all 3 static methods with success, failure, and edge cases.
 *
 * Methods tested:
 * - create({ actorId, action, targetType, targetId, details, ipAddress })
 * - findByTarget(targetType, targetId, limit=50)
 * - findByActor(actorId, limit=50)
 */

const AuditLog = require('../../../models/AuditLog');
const { createMockPool } = require('../../helpers/mocks');

// Mock dependencies
jest.mock('../../../config/database');
jest.mock('../../../utils/logger');

const pool = require('../../../config/database');
const logger = require('../../../utils/logger');

describe('AuditLog Model', () => {
  let mockPool;

  beforeEach(() => {
    mockPool = createMockPool();
    Object.assign(pool, mockPool);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create audit log with all fields', async () => {
      // Arrange
      const auditData = {
        actorId: 1,
        action: 'USER_UPDATED',
        targetType: 'user',
        targetId: 5,
        details: { oldEmail: 'old@test.com', newEmail: 'new@test.com' },
        ipAddress: '192.168.1.100'
      };
      const mockAuditLog = { id: 100, ...auditData, details: JSON.stringify(auditData.details), created_at: new Date() };
      mockPool.query.mockResolvedValue({ rows: [mockAuditLog] });

      // Act
      const result = await AuditLog.create(auditData);

      // Assert
      expect(result).toEqual(mockAuditLog);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        [1, 'USER_UPDATED', 'user', 5, JSON.stringify(auditData.details), '192.168.1.100']
      );
    });

    it('should serialize details object to JSON string', async () => {
      // Arrange
      const complexDetails = {
        changes: { role: { from: 'admin', to: 'super_admin' }, status: { from: 'active', to: 'inactive' } },
        metadata: { timestamp: '2025-01-01T00:00:00Z', reason: 'Security update' }
      };
      const auditData = {
        actorId: 2,
        action: 'USER_ROLE_CHANGED',
        targetType: 'user',
        targetId: 10,
        details: complexDetails,
        ipAddress: '10.0.0.1'
      };
      const mockAuditLog = { id: 101, ...auditData, details: JSON.stringify(complexDetails), created_at: new Date() };
      mockPool.query.mockResolvedValue({ rows: [mockAuditLog] });

      // Act
      await AuditLog.create(auditData);

      // Assert
      const [, params] = mockPool.query.mock.calls[0];
      expect(params[4]).toBe(JSON.stringify(complexDetails));
      expect(typeof params[4]).toBe('string');
    });

    it('should use parameterized queries to prevent SQL injection', async () => {
      // Arrange
      const maliciousAction = "'; DROP TABLE audit_logs; --";
      const auditData = {
        actorId: 1,
        action: maliciousAction,
        targetType: 'user',
        targetId: 1,
        details: {},
        ipAddress: '127.0.0.1'
      };
      const mockAuditLog = { id: 102, ...auditData, details: '{}', created_at: new Date() };
      mockPool.query.mockResolvedValue({ rows: [mockAuditLog] });

      // Act
      await AuditLog.create(auditData);

      // Assert
      const [query, params] = mockPool.query.mock.calls[0];
      expect(query).toContain('$1');
      expect(query).toContain('$2');
      expect(query).toContain('$3');
      expect(query).toContain('$4');
      expect(query).toContain('$5');
      expect(query).toContain('$6');
      expect(params[1]).toBe(maliciousAction);
      expect(query).not.toContain('DROP TABLE');
    });

    it('should log slow query warning when query takes > 500ms', async () => {
      // Arrange
      const auditData = {
        actorId: 1,
        action: 'USER_LOGIN',
        targetType: 'user',
        targetId: 1,
        details: {},
        ipAddress: '192.168.1.1'
      };
      const mockAuditLog = { id: 103, ...auditData, details: '{}', created_at: new Date() };

      // Mock Date.now to simulate slow query
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = jest.fn(() => {
        callCount++;
        return callCount === 1 ? 1000 : 1700; // 700ms duration
      });

      mockPool.query.mockResolvedValue({ rows: [mockAuditLog] });

      // Act
      await AuditLog.create(auditData);

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'AuditLog.create: Slow query detected',
        expect.objectContaining({ duration: 700, action: 'USER_LOGIN' })
      );

      // Cleanup
      Date.now = originalDateNow;
    });

    it('should throw error on database failure', async () => {
      // Arrange
      const auditData = {
        actorId: 999,
        action: 'INVALID_ACTION',
        targetType: 'user',
        targetId: 1,
        details: {},
        ipAddress: '127.0.0.1'
      };
      const dbError = new Error('Foreign key constraint violation');
      dbError.code = '23503';
      mockPool.query.mockRejectedValue(dbError);

      // Act & Assert
      await expect(AuditLog.create(auditData)).rejects.toThrow('Foreign key constraint violation');
      expect(logger.error).toHaveBeenCalledWith(
        'AuditLog.create: Database error',
        expect.objectContaining({
          actorId: 999,
          action: 'INVALID_ACTION',
          error: 'Foreign key constraint violation',
          code: '23503'
        })
      );
    });

    it('should return audit log with RETURNING * clause', async () => {
      // Arrange
      const auditData = {
        actorId: 3,
        action: 'TICKET_CREATED',
        targetType: 'ticket',
        targetId: 50,
        details: { title: 'New ticket' },
        ipAddress: '172.16.0.1'
      };
      const mockAuditLog = {
        id: 104,
        actor_id: 3,
        action: 'TICKET_CREATED',
        target_type: 'ticket',
        target_id: 50,
        details: JSON.stringify({ title: 'New ticket' }),
        ip_address: '172.16.0.1',
        created_at: new Date()
      };
      mockPool.query.mockResolvedValue({ rows: [mockAuditLog] });

      // Act
      const result = await AuditLog.create(auditData);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('actor_id');
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('target_type');
      expect(result).toHaveProperty('target_id');
      expect(result).toHaveProperty('details');
      expect(result).toHaveProperty('ip_address');
      expect(result).toHaveProperty('created_at');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('RETURNING *'),
        expect.any(Array)
      );
    });

    it('should log creation with all audit metadata', async () => {
      // Arrange
      const auditData = {
        actorId: 5,
        action: 'PASSWORD_CHANGED',
        targetType: 'user',
        targetId: 5,
        details: { method: 'self-service' },
        ipAddress: '203.0.113.42'
      };
      const mockAuditLog = { id: 105, ...auditData, details: JSON.stringify(auditData.details), created_at: new Date() };
      mockPool.query.mockResolvedValue({ rows: [mockAuditLog] });

      // Act
      await AuditLog.create(auditData);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(
        'AuditLog.create: Creating audit log entry',
        expect.objectContaining({
          actorId: 5,
          action: 'PASSWORD_CHANGED',
          targetType: 'user',
          targetId: 5,
          ipAddress: '203.0.113.42'
        })
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'AuditLog.create: Audit log created',
        expect.objectContaining({ auditLogId: 105 })
      );
    });
  });

  describe('findByTarget', () => {
    it('should return audit logs for target ordered by created_at DESC', async () => {
      // Arrange
      const mockLogs = [
        { id: 1, action: 'USER_UPDATED', target_type: 'user', target_id: 10, created_at: new Date('2025-01-03') },
        { id: 2, action: 'USER_CREATED', target_type: 'user', target_id: 10, created_at: new Date('2025-01-01') }
      ];
      mockPool.query.mockResolvedValue({ rows: mockLogs });

      // Act
      const result = await AuditLog.findByTarget('user', 10);

      // Assert
      expect(result).toEqual(mockLogs);
      expect(result).toHaveLength(2);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        ['user', 10, 50]
      );
    });

    it('should return empty array when no logs for target', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await AuditLog.findByTarget('ticket', 999);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(logger.debug).toHaveBeenCalledWith(
        'AuditLog.findByTarget: Query completed',
        expect.objectContaining({ targetType: 'ticket', targetId: 999, rowCount: 0 })
      );
    });

    it('should respect limit parameter (default 50)', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act
      await AuditLog.findByTarget('user', 1);

      // Assert
      const [query, params] = mockPool.query.mock.calls[0];
      expect(query).toContain('LIMIT $3');
      expect(params[2]).toBe(50);
    });

    it('should respect custom limit parameter', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act
      await AuditLog.findByTarget('user', 1, 100);

      // Assert
      const [, params] = mockPool.query.mock.calls[0];
      expect(params[2]).toBe(100);
    });

    it('should log slow query warning when query takes > 500ms', async () => {
      // Arrange
      const mockLogs = [{ id: 1, action: 'USER_UPDATED', target_type: 'user', target_id: 1, created_at: new Date() }];

      // Mock Date.now to simulate slow query
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = jest.fn(() => {
        callCount++;
        return callCount === 1 ? 1000 : 1600; // 600ms duration
      });

      mockPool.query.mockResolvedValue({ rows: mockLogs });

      // Act
      await AuditLog.findByTarget('user', 1);

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'AuditLog.findByTarget: Slow query detected',
        expect.objectContaining({ targetType: 'user', targetId: 1, duration: 600, rowCount: 1 })
      );

      // Cleanup
      Date.now = originalDateNow;
    });

    it('should throw error on database failure', async () => {
      // Arrange
      const dbError = new Error('Connection refused');
      dbError.code = 'ECONNREFUSED';
      mockPool.query.mockRejectedValue(dbError);

      // Act & Assert
      await expect(AuditLog.findByTarget('user', 1)).rejects.toThrow('Connection refused');
      expect(logger.error).toHaveBeenCalledWith(
        'AuditLog.findByTarget: Database error',
        expect.objectContaining({
          targetType: 'user',
          targetId: 1,
          error: 'Connection refused',
          code: 'ECONNREFUSED'
        })
      );
    });

    it('should use parameterized query to prevent SQL injection', async () => {
      // Arrange
      const maliciousType = "user'; DROP TABLE audit_logs; --";
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act
      await AuditLog.findByTarget(maliciousType, 1);

      // Assert
      const [query, params] = mockPool.query.mock.calls[0];
      expect(query).toContain('$1');
      expect(query).toContain('$2');
      expect(params[0]).toBe(maliciousType);
      expect(query).not.toContain('DROP TABLE');
    });
  });

  describe('findByActor', () => {
    it('should return audit logs for actor ordered by created_at DESC', async () => {
      // Arrange
      const mockLogs = [
        { id: 3, actor_id: 5, action: 'TICKET_UPDATED', created_at: new Date('2025-01-05') },
        { id: 4, actor_id: 5, action: 'COMMENT_CREATED', created_at: new Date('2025-01-04') },
        { id: 5, actor_id: 5, action: 'USER_LOGIN', created_at: new Date('2025-01-03') }
      ];
      mockPool.query.mockResolvedValue({ rows: mockLogs });

      // Act
      const result = await AuditLog.findByActor(5);

      // Assert
      expect(result).toEqual(mockLogs);
      expect(result).toHaveLength(3);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        [5, 50]
      );
    });

    it('should return empty array when no logs for actor', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await AuditLog.findByActor(999);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(logger.debug).toHaveBeenCalledWith(
        'AuditLog.findByActor: Query completed',
        expect.objectContaining({ actorId: 999, rowCount: 0 })
      );
    });

    it('should respect limit parameter (default 50)', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act
      await AuditLog.findByActor(1);

      // Assert
      const [query, params] = mockPool.query.mock.calls[0];
      expect(query).toContain('LIMIT $2');
      expect(params[1]).toBe(50);
    });

    it('should respect custom limit parameter', async () => {
      // Arrange
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act
      await AuditLog.findByActor(1, 25);

      // Assert
      const [, params] = mockPool.query.mock.calls[0];
      expect(params[1]).toBe(25);
    });

    it('should log slow query warning when query takes > 500ms', async () => {
      // Arrange
      const mockLogs = [{ id: 1, actor_id: 2, action: 'USER_CREATED', created_at: new Date() }];

      // Mock Date.now to simulate slow query
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = jest.fn(() => {
        callCount++;
        return callCount === 1 ? 1000 : 1550; // 550ms duration
      });

      mockPool.query.mockResolvedValue({ rows: mockLogs });

      // Act
      await AuditLog.findByActor(2);

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'AuditLog.findByActor: Slow query detected',
        expect.objectContaining({ actorId: 2, duration: 550, rowCount: 1 })
      );

      // Cleanup
      Date.now = originalDateNow;
    });

    it('should throw error on database failure', async () => {
      // Arrange
      const dbError = new Error('Query timeout');
      dbError.code = 'ETIMEDOUT';
      mockPool.query.mockRejectedValue(dbError);

      // Act & Assert
      await expect(AuditLog.findByActor(1)).rejects.toThrow('Query timeout');
      expect(logger.error).toHaveBeenCalledWith(
        'AuditLog.findByActor: Database error',
        expect.objectContaining({
          actorId: 1,
          error: 'Query timeout',
          code: 'ETIMEDOUT'
        })
      );
    });

    it('should use parameterized query to prevent SQL injection', async () => {
      // Arrange
      const maliciousActorId = "1; DROP TABLE audit_logs; --";
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act
      await AuditLog.findByActor(maliciousActorId);

      // Assert
      const [query, params] = mockPool.query.mock.calls[0];
      expect(query).toContain('$1');
      expect(params[0]).toBe(maliciousActorId);
      expect(query).not.toContain('DROP TABLE');
    });

    it('should log query start and completion with row count', async () => {
      // Arrange
      const mockLogs = [
        { id: 1, actor_id: 3, action: 'ACTION_1', created_at: new Date() },
        { id: 2, actor_id: 3, action: 'ACTION_2', created_at: new Date() }
      ];
      mockPool.query.mockResolvedValue({ rows: mockLogs });

      // Act
      await AuditLog.findByActor(3);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(
        'AuditLog.findByActor: Starting query',
        expect.objectContaining({ actorId: 3, limit: 50 })
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'AuditLog.findByActor: Query completed',
        expect.objectContaining({ actorId: 3, rowCount: 2 })
      );
    });
  });
});
