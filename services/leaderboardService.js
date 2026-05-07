const { db } = require('../config/firebase');

const getLeaderboard = async (userId) => {
  // Get all users
  const usersSnap = await db.collection('users').get();

  // Get all achievements (for rewardPoints)
  const achievementsSnap = await db.collection('achievements').get();
  const achievementMap = {};
  achievementsSnap.docs.forEach(doc => {
    achievementMap[doc.id] = doc.data().rewardPoints || 0;
  });

  // Get all user achievements
  const userAchievementsSnap = await db.collection('userAchievements').get();

  // Sum achievement points per user
  const userPoints = {};
  userAchievementsSnap.docs.forEach(doc => {
    const data = doc.data();
    const pts = achievementMap[data.achievementId] || 0;
    userPoints[data.userId] = (userPoints[data.userId] || 0) + pts;
  });

  // Build leaderboard from all users
  const entries = usersSnap.docs.map(doc => ({
    userId: doc.id,
    name: doc.data().name || doc.data().email || doc.id,
    points: userPoints[doc.id] || 0,
    streak: doc.data().streak || 0,
    level: doc.data().level || 1,
    profilePicture: doc.data().profilePicture || null,
  }));

  // Sort by points descending, take top 10
  entries.sort((a, b) => b.points - a.points);
  const leaderboard = entries.slice(0, 10).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  // Find current user
  const userIndex = entries.findIndex(e => e.userId === userId);
  let currentUser = null;
  if (userIndex !== -1) {
    currentUser = { ...entries[userIndex], rank: userIndex + 1 };
  }

  return { leaderboard, currentUser };
};

module.exports = { getLeaderboard };
