const { auth, db } = require('../config/firebase');

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

// Exchange a custom token for an ID token via Firebase REST API
const exchangeCustomTokenForIdToken = async (customToken) => {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!data.idToken) throw new Error('Failed to exchange token');
  return data.idToken;
};

const signup = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const userRecord = await auth.createUser({ email, password, displayName: name });

    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      points: 0,
      level: 1,
      streak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      createdAt: new Date().toISOString(),
    });

    // Initialize simulator portfolio
    await db.collection('simulator').doc(userRecord.uid).set({
      balance: 10000,
      portfolio: {},
      totalValue: 10000,
    });

    const customToken = await auth.createCustomToken(userRecord.uid);
    const idToken = await exchangeCustomTokenForIdToken(customToken);

    res.status(201).json({
      message: 'User created successfully',
      uid: userRecord.uid,
      token: idToken,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const login = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const userRecord = await auth.getUserByEmail(email);
    const customToken = await auth.createCustomToken(userRecord.uid);
    const idToken = await exchangeCustomTokenForIdToken(customToken);

    res.json({
      message: 'Login successful',
      uid: userRecord.uid,
      token: idToken,
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

module.exports = { signup, login };
