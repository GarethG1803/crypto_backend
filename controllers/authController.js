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

// Check if a username is already taken (case-insensitive)
const isUsernameTaken = async (name, excludeUid = null) => {
  const normalized = name.trim().toLowerCase();
  const snapshot = await db.collection('users').get();
  for (const doc of snapshot.docs) {
    if (excludeUid && doc.id === excludeUid) continue;
    const docName = (doc.data().name || '').trim().toLowerCase();
    if (docName === normalized) return true;
  }
  return false;
};

const signup = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    // Check username uniqueness
    if (await isUsernameTaken(name)) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

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
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Verify password via Firebase REST API signInWithPassword
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const signInData = await signInRes.json();

    if (signInData.error) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const idToken = signInData.idToken;
    const uid = signInData.localId;

    // Fetch user data from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    res.json({
      message: 'Login successful',
      uid,
      token: idToken,
      name: userData.name || '',
      points: userData.points || 0,
      isAdmin: userData.isAdmin || false,
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid email or password' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const data = userDoc.data();
    res.json({ name: data.name || '', email: data.email || '', points: data.points || 0, isAdmin: data.isAdmin || false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    // Check username uniqueness (exclude current user)
    if (await isUsernameTaken(name, req.user.uid)) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    await db.collection('users').doc(req.user.uid).update({ name: name.trim() });
    await auth.updateUser(req.user.uid, { displayName: name.trim() });
    res.json({ message: 'Profile updated', name: name.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const changePassword = async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    await auth.updateUser(req.user.uid, { password });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const checkUsername = async (req, res) => {
  const { name } = req.query;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    // If authenticated, exclude current user
    const excludeUid = req.user ? req.user.uid : null;
    const taken = await isUsernameTaken(name, excludeUid);
    res.json({ available: !taken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { signup, login, getProfile, updateProfile, changePassword, checkUsername };
