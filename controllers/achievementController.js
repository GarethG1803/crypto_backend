const { db } = require('../config/firebase');

const getAchievements = async (req, res) => {
  const userId = req.user.uid;
  try {
    // Get all achievements
    const achievementsSnap = await db.collection('achievements').get();
    const achievements = achievementsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get user's unlocked achievementss
    const userAchievementsSnap = await db.collection('userAchievements')
      .where('userId', '==', userId)
      .get();
    const unlocked = {};
    userAchievementsSnap.docs.forEach(doc => {
      const data = doc.data();
      unlocked[data.achievementId] = data.unlockedAt;
    });

    const result = achievements.map(a => ({
      ...a,
      unlocked: !!unlocked[a.id],
      unlockedAt: unlocked[a.id] || null,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAchievements };
