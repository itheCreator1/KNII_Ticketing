const User = require('../models/User');
const bcrypt = require('bcryptjs');

class UserService {
  async getUserById(id) {
    return await User.findById(id);
  }

  async getUserByUsername(username) {
    return await User.findByUsername(username);
  }

  async getAllUsers() {
    return await User.findAll();
  }

  async createUser(userData) {
    return await User.create(userData);
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await User.update(userId, { password_hash });

    return true;
  }
}

module.exports = new UserService();
