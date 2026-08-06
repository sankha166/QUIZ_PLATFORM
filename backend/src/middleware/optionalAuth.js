const { verifyToken } = require('../utils/jwt');
const { query } = require('../config/db');

/**
 * Optional authentication middleware.
 * If a valid Bearer token is present, req.user is populated.
 * Otherwise the request continues without a user (guest).
 */
const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token — continue as guest
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const result = await query(
      'SELECT id, name, email, role, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length && result.rows[0].status !== 'inactive') {
      req.user = result.rows[0];
    }
  } catch (_err) {
    // Token invalid / expired — continue as guest
  }
  next();
};

module.exports = optionalAuth;
