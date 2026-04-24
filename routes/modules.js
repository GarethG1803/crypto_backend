const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { getAllModules, getModuleById } = require('../controllers/moduleController');

router.get('/', verifyToken, getAllModules);
router.get('/:id', verifyToken, getModuleById);

module.exports = router;
