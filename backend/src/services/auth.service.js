const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../config/db');
const { generateToken } = require('../utils/jwt');

const register = async ({ name, email, password }) => {
  // Check duplicate
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (name, email, password, role, status)
     VALUES ($1, $2, $3, 'STUDENT', 'active')
     RETURNING id, name, email, role, status, created_at`,
    [name, email, hashed]
  );

  const user = result.rows[0];
  const token = generateToken({ userId: user.id, role: user.role, email: user.email });
  return { token, user };
};

const login = async ({ email, password }) => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  if (!result.rows.length) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const user = result.rows[0];

  if (user.status === 'inactive') {
    const err = new Error('Account is deactivated');
    err.status = 403;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const token = generateToken({ userId: user.id, role: user.role, email: user.email });
  const { password: _, ...safeUser } = user;
  return { token, user: safeUser };
};

const forgotPassword = async ({ email }) => {
  const result = await query('SELECT id, email FROM users WHERE email = $1', [email]);
  // Always respond successfully to prevent email enumeration
  if (!result.rows.length) return { message: 'If that email exists, a reset link has been sent.' };

  const user = result.rows[0];
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Invalidate existing tokens
  await query('UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1', [user.id]);

  await query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [user.id, token, expiresAt]
  );

  // In production, send email. For now, log the token.
  console.log(`Password reset token for ${email}: ${token}`);

  return { message: 'If that email exists, a reset link has been sent.', token };
};

const resetPassword = async ({ token, password }) => {
  const result = await query(
    `SELECT * FROM password_reset_tokens
     WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
    [token]
  );

  if (!result.rows.length) {
    const err = new Error('Invalid or expired reset token');
    err.status = 400;
    throw err;
  }

  const resetRecord = result.rows[0];
  const hashed = await bcrypt.hash(password, 10);

  await query('UPDATE users SET password = $1 WHERE id = $2', [hashed, resetRecord.user_id]);
  await query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [resetRecord.id]);

  return { message: 'Password reset successfully' };
};

module.exports = { register, login, forgotPassword, resetPassword };
