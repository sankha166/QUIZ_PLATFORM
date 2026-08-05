const leaderboardService = require('../services/leaderboard.service');

const getLeaderboard = async (req, res, next) => {
  try {
    const data = await leaderboardService.getLeaderboard(req.query);
    res.json({ success: true, leaderboard: data });
  } catch (err) { next(err); }
};

module.exports = { getLeaderboard };
