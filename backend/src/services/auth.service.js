const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
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

  const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSmtp) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: 'Reset your Quizora password',
      text: `Use this link to reset your Quizora password. It expires in one hour:\n\n${resetUrl}`,
      html: `<p>Use the link below to reset your Quizora password. It expires in one hour.</p><p><a href="${resetUrl}">Reset password</a></p>`,
    });
  } else if (process.env.NODE_ENV !== 'production') {
    console.log(`Password reset token for ${email}: ${token}`);
  } else {
    const err = new Error('Password reset email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and FRONTEND_URL.');
    err.status = 503;
    throw err;
  }

  return {
    message: 'If that email exists, a reset link has been sent.',
    ...(process.env.NODE_ENV !== 'production' && !hasSmtp ? { token } : {}),
  };
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
