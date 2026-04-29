const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const verifyAdmin = require('../middleware/adminAuth');
const {
  getDashboardStats,
  getAllUsers,
  getUserDetail,
  updateUser,
  deleteUser,
  getAllModulesAdmin,
  updateModule,
  getAllScores,
  resetUserProgress,
} = require('../controllers/adminController');

// All admin routes require authentication + admin check
router.use(verifyToken, verifyAdmin);

// Dashboard
router.get('/stats', getDashboardStats);

// Users
router.get('/users', getAllUsers);
router.get('/users/:uid', getUserDetail);
router.put('/users/:uid', updateUser);
router.delete('/users/:uid', deleteUser);

// Modules
router.get('/modules', getAllModulesAdmin);
router.put('/modules/:id', updateModule);

// Scores / Progress
router.get('/scores', getAllScores);
router.delete('/scores/:progressId', resetUserProgress);

module.exports = router;
