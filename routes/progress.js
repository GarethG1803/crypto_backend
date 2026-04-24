const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { getProgress, completeLesson } = require('../controllers/progressController');

router.get('/', verifyToken, getProgress);
router.post('/completeLesson', verifyToken, completeLesson);

module.exports = router;
