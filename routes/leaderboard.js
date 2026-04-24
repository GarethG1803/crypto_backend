const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { getLeaderboardData } = require('../controllers/leaderboardController');

router.get('/', verifyToken, getLeaderboardData);

module.exports = router;
