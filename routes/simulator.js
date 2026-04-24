const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { getPortfolio, executeTrade, getHistory } = require('../controllers/simulatorController');

router.get('/portfolio', verifyToken, getPortfolio);
router.post('/trade', verifyToken, executeTrade);
router.get('/history', verifyToken, getHistory);

module.exports = router;
