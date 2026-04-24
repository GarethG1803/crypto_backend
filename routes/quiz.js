const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { getQuiz, submitQuiz } = require('../controllers/quizController');

router.get('/:moduleId', verifyToken, getQuiz);
router.post('/submit', verifyToken, submitQuiz);

module.exports = router;
