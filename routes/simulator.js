const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { getPortfolio, executeTrade, getHistory, getChartDataHandler, setStopLoss } = require('../controllers/simulatorController');

router.get('/portfolio', verifyToken, getPortfolio);
router.post('/trade', verifyToken, executeTrade);
router.get('/history', verifyToken, getHistory);
router.get('/chart/:symbol', verifyToken, getChartDataHandler);
router.post('/stop-loss', verifyToken, setStopLoss);

module.exports = router;
