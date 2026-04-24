const { getLeaderboard } = require('../services/leaderboardService');

const getLeaderboardData = async (req, res) => {
  const userId = req.user.uid;
  try {
    const data = await getLeaderboard(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getLeaderboardData };
