const { db } = require('../config/firebase');

const calculateLevel = (points) => Math.floor(points / 500) + 1;

const awardPoints = async (userId, points) => {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) throw new Error('User not found');

  const currentPoints = userDoc.data().points || 0;
  const newTotal = currentPoints + points;
  const newLevel = calculateLevel(newTotal);

  await userRef.update({
    points: newTotal,
    level: newLevel,
  });

  return { points: newTotal, level: newLevel, awarded: points };
};

module.exports = { awardPoints, calculateLevel };
