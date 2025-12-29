const Ticket = require('../models/Ticket');
const User = require('../models/User');

class TicketService {
  async createTicket(ticketData) {
    return await Ticket.create(ticketData);
  }

  async getTicketById(id) {
    return await Ticket.findById(id);
  }

  async getAllTickets(filters = {}) {
    const cleanFilters = {
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      search: filters.search || undefined
    };

    return await Ticket.findAll(cleanFilters);
  }

  async updateTicket(id, updates) {
    const allowedUpdates = {};

    if (updates.status) {
      allowedUpdates.status = updates.status;
    }

    if (updates.priority) {
      allowedUpdates.priority = updates.priority;
    }

    // Validate and handle assigned_to
    if (updates.assigned_to !== undefined) {
      // Allow null to unassign
      if (updates.assigned_to === null || updates.assigned_to === '') {
        allowedUpdates.assigned_to = null;
      } else {
        // Validate that the user exists and is active
        const assignedUser = await User.findById(updates.assigned_to);
        if (!assignedUser || assignedUser.status !== 'active') {
          throw new Error('Cannot assign to inactive or non-existent user');
        }
        allowedUpdates.assigned_to = updates.assigned_to;
      }
    }

    return await Ticket.update(id, allowedUpdates);
  }
}

module.exports = new TicketService();
