const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { getAchievements } = require('../controllers/achievementController');

router.get('/', verifyToken, getAchievements);

module.exports = router;
