/**
 * Comment Model Unit Tests
 * Tests the Comment model in complete isolation with all dependencies mocked.
 * Covers all 2 static methods with success, failure, and edge cases.
 *
 * Methods tested:
 * - create({ ticket_id, user_id, content, is_internal })
 * - findByTicketId(ticketId)
 */

const Comment = require('../../../models/Comment');
const { createMockPool } = require('../../helpers/mocks');
const { createCommentData } = require('../../helpers/factories');

// Mock dependencies
jest.mock('../../../config/database');
jest.mock('../../../utils/logger');

const pool = require('../../../config/database');
const logger = require('../../../utils/logger');

describe('Comment Model', () => {
  let mockPool;

  beforeEach(() => {
    mockPool = createMockPool();
    Object.assign(pool, mockPool);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create comment with all fields', async () => {
      // Arrange
      const commentData = createCommentData({
        ticket_id: 1,
        user_id: 2,
        content: 'Test comment content',
        is_internal: true
      });
      const mockComment = { id: 10, ...commentData, created_at: new Date() };
      mockPool.query.mockResolvedValue({ rows: [mockComment] });

      // Act
      const result = await Comment.create(commentData);

      // Assert
      expect(result).toEqual(mockComment);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO comments'),
        [commentData.ticket_id, commentData.user_id, commentData.content, commentData.is_internal]
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Comment.create: Creating new comment',
        expect.objectContaining({ ticketId: 1, userId: 2, isInternal: true })
      );
    });

    it('should create comment with is_internal=false when not specified', async () => {
      // Arrange
      const commentData = { ticket_id: 1, user_id: 2, content: 'Public comment' };
      const mockComment = { id: 11, ...commentData, is_internal: false, created_at: new Date() };
      mockPool.query.mockResolvedValue({ rows: [mockComment] });

      // Act
      const result = await Comment.create(commentData);

      // Assert
      expect(result.is_internal).toBe(false);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        [1, 2, 'Public comment', false]
      );
    });

    it('should create comment with is_internal=false as default', async () => {
      // Arrange
      const commentData = createCommentData({ is_internal: undefined });
      const mockComment = { id: 12, ...commentData, is_internal: false, created_at: new Date() };
      mockPool.query.mockResolvedValue({ rows: [mockComment] });

      // Act
      const result = await Comment.create(commentData);

      // Assert
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([false]) // is_internal defaults to false
      );
    });

    it('should use parameterized queries to prevent SQL injection', async () => {
      // Arrange
      const maliciousContent = "'; DROP TABLE comments; --";
      const commentData = createCommentData({ content: maliciousContent });
      const mockComment = { id: 13, ...commentData, created_at: new Date() };
      mockPool.query.mockResolvedValue({ rows: [mockComment] });

      // Act
      await Comment.create(commentData);

      // Assert
      const [query, params] = mockPool.query.mock.calls[0];
      expect(query).toContain('$1');
      expect(query).toContain('$2');
      expect(query).toContain('$3');
      expect(query).toContain('$4');
      expect(params).toContain(maliciousContent);
      expect(query).not.toContain(maliciousContent);
    });

    it('should log slow query warning when query takes > 500ms', async () => {
      // Arrange
      const commentData = createCommentData();
      const mockComment = { id: 14, ...commentData, created_at: new Date() };

      // Mock Date.now to simulate slow query
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = jest.fn(() => {
        callCount++;
        return callCount === 1 ? 1000 : 1600; // 600ms duration
      });

      mockPool.query.mockResolvedValue({ rows: [mockComment] });

      // Act
      await Comment.create(commentData);

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Comment.create: Slow query detected',
        expect.objectContaining({ duration: 600 })
      );

      // Cleanup
      Date.now = originalDateNow;
    });

    it('should throw error on database failure', async () => {
      // Arrange
      const commentData = createCommentData();
      const dbError = new Error('Foreign key constraint violation');
      dbError.code = '23503';
      mockPool.query.mockRejectedValue(dbError);

      // Act & Assert
      await expect(Comment.create(commentData)).rejects.toThrow('Foreign key constraint violation');
      expect(logger.error).toHaveBeenCalledWith(
        'Comment.create: Database error',
        expect.objectContaining({
          error: 'Foreign key constraint violation',
          code: '23503'
        })
      );
    });

    it('should return comment with RETURNING * clause', async () => {
      // Arrange
      const commentData = createCommentData();
      const mockComment = {
        id: 15,
        ticket_id: commentData.ticket_id,
        user_id: commentData.user_id,
        content: commentData.content,
        is_internal: commentData.is_internal,
        created_at: new Date()
      };
      mockPool.query.mockResolvedValue({ rows: [mockComment] });

      // Act
      const result = await Comment.create(commentData);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('ticket_id');
      expect(result).toHaveProperty('user_id');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('is_internal');
      expect(result).toHaveProperty('created_at');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('RETURNING *'),
        expect.any(Array)
      );
    });

    it('should log creation with ticket ID, user ID, and content length', async () => {
      // Arrange
      const commentData = createCommentData({ content: 'A'.repeat(150) });
      const mockComment = { id: 16, ...commentData, created_at: new Date() };
      mockPool.query.mockResolvedValue({ rows: [mockComment] });

      // Act
      await Comment.create(commentData);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Comment.create: Creating new comment',
        expect.objectContaining({
          ticketId: commentData.ticket_id,
          userId: commentData.user_id,
          contentLength: 150
        })
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Comment.create: Comment created successfully',
        expect.objectContaining({ commentId: 16 })
      );
    });

    it('should handle foreign key constraint violation for ticket_id', async () => {
      // Arrange
      const commentData = createCommentData({ ticket_id: 99999 });
      const fkError = new Error('insert or update on table "comments" violates foreign key constraint');
      fkError.code = '23503';
      mockPool.query.mockRejectedValue(fkError);

      // Act & Assert
      await expect(Comment.create(commentData)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        'Comment.create: Database error',
        expect.objectContaining({ code: '23503' })
      );
    });

    it('should handle foreign key constraint violation for user_id', async () => {
      // Arrange
      const commentData = createCommentData({ user_id: 99999 });
      const fkError = new Error('insert or update on table "comments" violates foreign key constraint');
      fkError.code = '23503';
      mockPool.query.mockRejectedValue(fkError);

      // Act & Assert
      await expect(Comment.create(commentData)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        'Comment.create: Database error',
        expect.objectContaining({ ticketId: commentData.ticket_id, userId: 99999 })
      );
    });
  });

  describe('findByTicketId', () => {
    it('should return comments for ticket with username via JOIN', async () => {
      // Arrange
      const ticketId = 1;
      const mockComments = [
        { id: 1, ticket_id: 1, user_id: 2, content: 'First comment', is_internal: false, username: 'john_doe', created_at: new Date('2025-01-01') },
        { id: 2, ticket_id: 1, user_id: 3, content: 'Second comment', is_internal: true, username: 'jane_admin', created_at: new Date('2025-01-02') }
      ];
      mockPool.query.mockResolvedValue({ rows: mockComments });

      // Act
      const result = await Comment.findByTicketId(ticketId);

      // Assert
      expect(result).toEqual(mockComments);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('username', 'john_doe');
      expect(result[1]).toHaveProperty('username', 'jane_admin');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('JOIN users u ON c.user_id = u.id'),
        [ticketId]
      );
    });

    it('should return empty array when no comments for ticket', async () => {
      // Arrange
      const ticketId = 999;
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await Comment.findByTicketId(ticketId);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(logger.debug).toHaveBeenCalledWith(
        'Comment.findByTicketId: Query completed',
        expect.objectContaining({ ticketId: 999, rowCount: 0 })
      );
    });

    it('should order comments by created_at ASC (chronological)', async () => {
      // Arrange
      const ticketId = 1;
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act
      await Comment.findByTicketId(ticketId);

      // Assert
      const [query] = mockPool.query.mock.calls[0];
      expect(query).toContain('ORDER BY c.created_at ASC');
    });

    it('should return both internal and public comments', async () => {
      // Arrange
      const ticketId = 1;
      const mockComments = [
        { id: 1, ticket_id: 1, user_id: 2, content: 'Public', is_internal: false, username: 'user1', created_at: new Date() },
        { id: 2, ticket_id: 1, user_id: 3, content: 'Internal', is_internal: true, username: 'admin1', created_at: new Date() }
      ];
      mockPool.query.mockResolvedValue({ rows: mockComments });

      // Act
      const result = await Comment.findByTicketId(ticketId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.some(c => c.is_internal === false)).toBe(true);
      expect(result.some(c => c.is_internal === true)).toBe(true);
    });

    it('should log slow query warning when query takes > 500ms', async () => {
      // Arrange
      const ticketId = 1;
      const mockComments = [{ id: 1, ticket_id: 1, user_id: 2, content: 'Comment', username: 'user1', created_at: new Date() }];

      // Mock Date.now to simulate slow query
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = jest.fn(() => {
        callCount++;
        return callCount === 1 ? 1000 : 1550; // 550ms duration
      });

      mockPool.query.mockResolvedValue({ rows: mockComments });

      // Act
      await Comment.findByTicketId(ticketId);

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Comment.findByTicketId: Slow query detected',
        expect.objectContaining({ ticketId: 1, duration: 550, rowCount: 1 })
      );

      // Cleanup
      Date.now = originalDateNow;
    });

    it('should throw error on database failure', async () => {
      // Arrange
      const ticketId = 1;
      const dbError = new Error('Connection timeout');
      dbError.code = 'ECONNREFUSED';
      mockPool.query.mockRejectedValue(dbError);

      // Act & Assert
      await expect(Comment.findByTicketId(ticketId)).rejects.toThrow('Connection timeout');
      expect(logger.error).toHaveBeenCalledWith(
        'Comment.findByTicketId: Database error',
        expect.objectContaining({
          ticketId: 1,
          error: 'Connection timeout',
          code: 'ECONNREFUSED'
        })
      );
    });

    it('should use parameterized query to prevent SQL injection', async () => {
      // Arrange
      const maliciousTicketId = "1; DROP TABLE comments; --";
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act
      await Comment.findByTicketId(maliciousTicketId);

      // Assert
      const [query, params] = mockPool.query.mock.calls[0];
      expect(query).toContain('$1');
      expect(params[0]).toBe(maliciousTicketId);
      expect(query).not.toContain('DROP TABLE');
    });

    it('should log query start and completion with row count', async () => {
      // Arrange
      const ticketId = 5;
      const mockComments = [
        { id: 1, ticket_id: 5, user_id: 2, content: 'Comment 1', username: 'user1', created_at: new Date() },
        { id: 2, ticket_id: 5, user_id: 3, content: 'Comment 2', username: 'user2', created_at: new Date() },
        { id: 3, ticket_id: 5, user_id: 4, content: 'Comment 3', username: 'user3', created_at: new Date() }
      ];
      mockPool.query.mockResolvedValue({ rows: mockComments });

      // Act
      await Comment.findByTicketId(ticketId);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(
        'Comment.findByTicketId: Starting query',
        expect.objectContaining({ ticketId: 5 })
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Comment.findByTicketId: Query completed',
        expect.objectContaining({ ticketId: 5, rowCount: 3 })
      );
    });

    it('should include all comment fields in result', async () => {
      // Arrange
      const ticketId = 1;
      const mockComment = {
        id: 100,
        ticket_id: 1,
        user_id: 50,
        content: 'Full comment content here',
        is_internal: true,
        created_at: new Date('2025-01-15T10:30:00Z'),
        username: 'test_user'
      };
      mockPool.query.mockResolvedValue({ rows: [mockComment] });

      // Act
      const result = await Comment.findByTicketId(ticketId);

      // Assert
      expect(result[0]).toHaveProperty('id', 100);
      expect(result[0]).toHaveProperty('ticket_id', 1);
      expect(result[0]).toHaveProperty('user_id', 50);
      expect(result[0]).toHaveProperty('content', 'Full comment content here');
      expect(result[0]).toHaveProperty('is_internal', true);
      expect(result[0]).toHaveProperty('created_at');
      expect(result[0]).toHaveProperty('username', 'test_user');
    });
  });
});
