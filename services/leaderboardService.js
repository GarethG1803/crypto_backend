const { db } = require('../config/firebase');

const getLeaderboard = async (userId) => {
  const snapshot = await db.collection('users')
    .orderBy('points', 'desc')
    .limit(10)
    .get();

  const leaderboard = snapshot.docs.map((doc, index) => ({
    rank: index + 1,
    userId: doc.id,
    name: doc.data().name,
    points: doc.data().points,
    streak: doc.data().streak || 0,
    level: doc.data().level || 1,
  }));

  // Find current user's rank if not in top 10
  let currentUserRank = leaderboard.find(u => u.userId === userId);
  if (!currentUserRank) {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const higherCount = await db.collection('users')
        .where('points', '>', userData.points)
        .count()
        .get();
      currentUserRank = {
        rank: higherCount.data().count + 1,
        userId,
        name: userData.name,
        points: userData.points,
        streak: userData.streak || 0,
        level: userData.level || 1,
      };
    }
  }

  return { leaderboard, currentUser: currentUserRank };
};

module.exports = { getLeaderboard };
