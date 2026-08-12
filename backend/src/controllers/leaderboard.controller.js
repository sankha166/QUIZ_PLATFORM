const leaderboardService = require('../services/leaderboard.service');
const { query } = require('../config/db');

const getLeaderboard = async (req, res, next) => {
  try {
    const params = { ...req.query };
    if (req.user?.role === 'STUDENT') {
      const result = await query('SELECT preferred_domain_id FROM users WHERE id = $1', [req.user.id]);
      params.domainId = result.rows[0]?.preferred_domain_id || null;
    }
    const data = await leaderboardService.getLeaderboard(params);
    res.json({ success: true, leaderboard: data });
  } catch (err) { next(err); }
};

module.exports = { getLeaderboard };