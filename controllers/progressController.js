const { db } = require('../config/firebase');
const { awardPoints } = require('../services/pointsService');
const { updateStreak } = require('../services/streakService');
const { checkAndUnlockAchievements } = require('../services/achievementService');

const getProgress = async (req, res) => {
  const userId = req.user.uid;
  try {
    const snapshot = await db.collection('progress')
      .where('userId', '==', userId)
      .get();

    const progress = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const completeLesson = async (req, res) => {
  const userId = req.user.uid;
  const { moduleId } = req.body;

  if (!moduleId) {
    return res.status(400).json({ error: 'moduleId is required' });
  }

  try {
    const progressId = `${userId}_${moduleId}`;
    const existingDoc = await db.collection('progress').doc(progressId).get();

    if (existingDoc.exists && existingDoc.data().lessonCompleted) {
      return res.json({ message: 'Lesson already completed', alreadyCompleted: true });
    }

    // Get module reward points
    const moduleDoc = await db.collection('modules').doc(moduleId).get();
    if (!moduleDoc.exists) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const rewardPoints = moduleDoc.data().rewardPoints;

    await db.collection('progress').doc(progressId).set({
      userId,
      moduleId,
      lessonCompleted: true,
      quizScore: null,
      quizCompleted: false,
      completedAt: new Date().toISOString(),
    }, { merge: true });

    const pointsResult = await awardPoints(userId, rewardPoints);
    await updateStreak(userId);
    const newAchievements = await checkAndUnlockAchievements(userId);

    res.json({
      message: 'Lesson completed',
      earnedPoints: rewardPoints,
      totalPoints: pointsResult.points,
      level: pointsResult.level,
      newAchievements: newAchievements.map(a => ({ title: a.title, icon: a.icon })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getProgress, completeLesson };
