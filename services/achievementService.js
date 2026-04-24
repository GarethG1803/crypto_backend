const { db } = require('../config/firebase');
const { awardPoints } = require('./pointsService');

const checkAndUnlockAchievements = async (userId) => {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return [];

  const user = userDoc.data();

  // Count completed lessons
  const progressSnap = await db.collection('progress')
    .where('userId', '==', userId)
    .where('lessonCompleted', '==', true)
    .get();
  const lessonsCompleted = progressSnap.size;

  // Count perfect quizzes
  const perfectQuizSnap = await db.collection('progress')
    .where('userId', '==', userId)
    .where('quizScore', '==', 100)
    .get();
  const perfectQuizzes = perfectQuizSnap.size;

  // Get all achievements
  const achievementsSnap = await db.collection('achievements').get();

  // Get user's existing unlocks
  const userAchievementsSnap = await db.collection('userAchievements')
    .where('userId', '==', userId)
    .get();
  const unlockedIds = new Set(userAchievementsSnap.docs.map(d => d.data().achievementId));

  const newlyUnlocked = [];

  for (const doc of achievementsSnap.docs) {
    const achievement = { id: doc.id, ...doc.data() };
    if (unlockedIds.has(achievement.id)) continue;

    const { type, value } = achievement.condition;
    let met = false;

    switch (type) {
      case 'lessonsCompleted':
        met = lessonsCompleted >= value;
        break;
      case 'points':
        met = user.points >= value;
        break;
      case 'streak':
        met = user.streak >= value;
        break;
      case 'perfectQuizzes':
        met = perfectQuizzes >= value;
        break;
    }

    if (met) {
      const docId = `${userId}_${achievement.id}`;
      await db.collection('userAchievements').doc(docId).set({
        userId,
        achievementId: achievement.id,
        unlockedAt: new Date().toISOString(),
      });

      if (achievement.rewardPoints) {
        await awardPoints(userId, achievement.rewardPoints);
      }

      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
};

module.exports = { checkAndUnlockAchievements };
