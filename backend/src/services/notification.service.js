const { query } = require('../config/db');

const TYPES = {
  QUIZ_COMPLETED: 'quiz_completed',
  QUIZ_PASSED: 'quiz_passed',
  QUIZ_FAILED: 'quiz_failed',
  NEW_QUIZ: 'new_quiz',
  ACCOUNT_STATUS: 'account_status',
  SYSTEM: 'system',
};

const create = async (userId, { type, title, message, data = {} }) => {
  const result = await query(
    `INSERT INTO notifications (user_id, type, title, message, data)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, type, title, message, JSON.stringify(data)]
  );
  return result.rows[0];
};

const getForUser = async (userId, { limit = 20, offset = 0 } = {}) => {
  const result = await query(
    `SELECT * FROM notifications WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  const unread = await query(
    `SELECT COUNT(*)::int AS cnt FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return { notifications: result.rows, unreadCount: unread.rows[0].cnt };
};

const markRead = async (userId, notificationId) => {
  const result = await query(
    `UPDATE notifications SET is_read = TRUE
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0];
};

const markAllRead = async (userId) => {
  await query(
    `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return { message: 'All notifications marked as read' };
};

const deleteOne = async (userId, notificationId) => {
  await query(
    `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
  return { message: 'Notification deleted' };
};

// Helper: notify after quiz submission
const notifyQuizResult = async (userId, { quizTitle, percentage, status, attemptId }) => {
  const passed = status === 'passed';
  await create(userId, {
    type: passed ? TYPES.QUIZ_PASSED : TYPES.QUIZ_FAILED,
    title: passed ? '🎉 Quiz Passed!' : '📉 Quiz Result',
    message: `You scored ${parseFloat(percentage).toFixed(1)}% on "${quizTitle}" — ${passed ? 'PASSED' : 'FAILED'}.`,
    data: { attemptId, percentage, status, quizTitle },
  });
};

// Helper: notify when admin publishes new quiz
const notifyNewQuiz = async (studentIds, { quizTitle, quizId }) => {
  for (const uid of studentIds) {
    await create(uid, {
      type: TYPES.NEW_QUIZ,
      title: '📝 New Quiz Available',
      message: `A new quiz "${quizTitle}" has been published. Start it now!`,
      data: { quizId, quizTitle },
    });
  }
};

// Helper: notify account status change
const notifyAccountStatus = async (userId, status) => {
  await create(userId, {
    type: TYPES.ACCOUNT_STATUS,
    title: status === 'active' ? '✅ Account Activated' : '⚠️ Account Deactivated',
    message: status === 'active'
      ? 'Your account has been activated. You can now log in.'
      : 'Your account has been deactivated by an administrator.',
    data: { status },
  });
};

module.exports = { create, getForUser, markRead, markAllRead, deleteOne, notifyQuizResult, notifyNewQuiz, notifyAccountStatus, TYPES };
