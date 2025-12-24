const bcrypt = require('bcryptjs');
const User = require('../models/User');

class AuthService {
  async authenticate(username, password) {
    const user = await User.findByUsername(username);
    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  createSessionData(user) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
  }
}

module.exports = new AuthService();
