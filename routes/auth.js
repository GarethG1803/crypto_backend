const express = require('express');
const router = express.Router();
const { signup, login, getProfile, updateProfile, changePassword, checkUsername } = require('../controllers/authController');
const verifyToken = require('../middleware/auth');

// Optional auth — attaches user if token present, doesn't block if missing
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const { auth } = require('../config/firebase');
    try {
      const decoded = await auth.verifyIdToken(header.split('Bearer ')[1]);
      req.user = decoded;
    } catch {}
  }
  next();
};

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);
router.get('/check-username', optionalAuth, checkUsername);

module.exports = router;
