const { db } = require('../config/firebase');
const { updateStreak } = require('../services/streakService');

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

    await db.collection('progress').doc(progressId).set({
      userId,
      moduleId,
      lessonCompleted: true,
      quizScore: null,
      quizCompleted: false,
      completedAt: new Date().toISOString(),
    }, { merge: true });

    await updateStreak(userId);

    res.json({
      message: 'Lesson completed',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getProgress, completeLesson };
