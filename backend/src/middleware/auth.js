const { verifyToken } = require('../utils/jwt');
const { query } = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Fetch fresh user from DB to check status
    const result = await query(
      'SELECT id, name, email, role, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];
    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = authenticate;
