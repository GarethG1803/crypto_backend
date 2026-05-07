const { auth, db } = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.split('Bearer ')[1];
  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;

    // Update lastActiveDate in background (fire-and-forget)
    db.collection('users').doc(decoded.uid).update({
      lastActiveDate: new Date().toISOString(),
    }).catch(() => {});

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = verifyToken;
