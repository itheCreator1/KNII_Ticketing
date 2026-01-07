const pool = require('../config/database');
const logger = require('../utils/logger');

class Comment {
  static async create({ ticket_id, user_id, content }) {
    const startTime = Date.now();
    try {
      logger.info('Comment.create: Creating new comment', { ticketId: ticket_id, userId: user_id, contentLength: content?.length });
      const result = await pool.query(
        `INSERT INTO comments (ticket_id, user_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [ticket_id, user_id, content]
      );
      const duration = Date.now() - startTime;

      if (duration > 500) {
        logger.warn('Comment.create: Slow query detected', { ticketId: ticket_id, userId: user_id, duration });
      }

      logger.info('Comment.create: Comment created successfully', { commentId: result.rows[0].id, ticketId: ticket_id, userId: user_id, duration });
      return result.rows[0];
    } catch (error) {
      logger.error('Comment.create: Database error', {
        ticketId: ticket_id,
        userId: user_id,
        error: error.message,
        stack: error.stack,
        code: error.code
      });
      throw error;
    }
  }

  static async findByTicketId(ticketId) {
    const startTime = Date.now();
    try {
      logger.debug('Comment.findByTicketId: Starting query', { ticketId });
      const result = await pool.query(
        `SELECT c.*, u.username
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.ticket_id = $1
         ORDER BY c.created_at ASC`,
        [ticketId]
      );
      const duration = Date.now() - startTime;

      if (duration > 500) {
        logger.warn('Comment.findByTicketId: Slow query detected', { ticketId, duration, rowCount: result.rows.length });
      }

      logger.debug('Comment.findByTicketId: Query completed', { ticketId, rowCount: result.rows.length, duration });
      return result.rows;
    } catch (error) {
      logger.error('Comment.findByTicketId: Database error', {
        ticketId,
        error: error.message,
        stack: error.stack,
        code: error.code
      });
      throw error;
    }
  }

  static async getLastCommentsByTicketIds(ticketIds) {
    const startTime = Date.now();
    try {
      if (!ticketIds || ticketIds.length === 0) {
        logger.debug('Comment.getLastCommentsByTicketIds: Empty ticket IDs array');
        return [];
      }

      logger.debug('Comment.getLastCommentsByTicketIds: Starting query', { ticketCount: ticketIds.length });
      const result = await pool.query(`
        SELECT DISTINCT ON (c.ticket_id)
          c.ticket_id,
          c.content,
          u.username,
          c.created_at
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.ticket_id = ANY($1::int[])
        ORDER BY c.ticket_id, c.created_at DESC
      `, [ticketIds]);

      const duration = Date.now() - startTime;

      if (duration > 500) {
        logger.warn('Comment.getLastCommentsByTicketIds: Slow query detected', { ticketCount: ticketIds.length, duration });
      }

      logger.debug('Comment.getLastCommentsByTicketIds: Query completed', { ticketCount: ticketIds.length, resultCount: result.rows.length, duration });
      return result.rows;
    } catch (error) {
      logger.error('Comment.getLastCommentsByTicketIds: Database error', {
        ticketCount: ticketIds?.length,
        error: error.message,
        stack: error.stack,
        code: error.code
      });
      throw error;
    }
  }
}

module.exports = Comment;
