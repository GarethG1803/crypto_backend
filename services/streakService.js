const { db } = require('../config/firebase');

const updateStreak = async (userId) => {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) throw new Error('User not found');

  const data = userDoc.data();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const lastActive = data.lastActiveDate || null;

  let newStreak = data.streak || 0;

  if (lastActive === today) {
    return { streak: newStreak, longestStreak: data.longestStreak || 0 };
  }

  if (lastActive) {
    const lastDate = new Date(lastActive);
    const diffMs = now.setHours(0, 0, 0, 0) - lastDate.setHours(0, 0, 0, 0);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  const longestStreak = Math.max(newStreak, data.longestStreak || 0);

  await userRef.update({
    streak: newStreak,
    longestStreak,
    lastActiveDate: today,
  });

  return { streak: newStreak, longestStreak };
};

module.exports = { updateStreak };
