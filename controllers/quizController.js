const { db } = require('../config/firebase');
const { awardPoints } = require('../services/pointsService');
const { updateStreak } = require('../services/streakService');
const { checkAndUnlockAchievements } = require('../services/achievementService');

const getQuiz = async (req, res) => {
  try {
    const snapshot = await db.collection('quizzes')
      .where('moduleId', '==', req.params.moduleId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Quiz not found for this module' });
    }

    const quiz = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    // Strip correct answers before sending to client
    const sanitized = {
      id: quiz.id,
      moduleId: quiz.moduleId,
      questions: quiz.questions.map(q => ({
        question: q.question,
        options: q.options,
      })),
    };

    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const submitQuiz = async (req, res) => {
  const userId = req.user.uid;
  const { moduleId, answers } = req.body;

  if (!moduleId || !answers) {
    return res.status(400).json({ error: 'moduleId and answers are required' });
  }

  try {
    // Get quiz with correct answers
    const snapshot = await db.collection('quizzes')
      .where('moduleId', '==', moduleId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const quiz = snapshot.docs[0].data();

    // Grade the quiz
    let correct = 0;
    const results = quiz.questions.map((q, i) => {
      const isCorrect = answers[i] === q.correctAnswer;
      if (isCorrect) correct++;
      return {
        question: q.question,
        yourAnswer: answers[i],
        correctAnswer: q.correctAnswer,
        correct: isCorrect,
        explanation: q.explanation,
      };
    });

    const scorePercent = Math.round((correct / quiz.questions.length) * 100);

    // Get module reward points
    const moduleDoc = await db.collection('modules').doc(moduleId).get();
    const rewardPoints = moduleDoc.exists ? moduleDoc.data().rewardPoints : 100;
    const earnedPoints = Math.round((scorePercent / 100) * rewardPoints);

    // Save progress
    const progressId = `${userId}_${moduleId}`;
    await db.collection('progress').doc(progressId).set({
      userId,
      moduleId,
      lessonCompleted: true,
      quizScore: scorePercent,
      quizCompleted: true,
      completedAt: new Date().toISOString(),
    }, { merge: true });

    // Award points
    const pointsResult = await awardPoints(userId, earnedPoints);
    await updateStreak(userId);
    const newAchievements = await checkAndUnlockAchievements(userId);

    res.json({
      score: scorePercent,
      correct,
      total: quiz.questions.length,
      earnedPoints,
      results,
      newAchievements: newAchievements.map(a => ({ title: a.title, icon: a.icon })),
      totalPoints: pointsResult.points,
      level: pointsResult.level,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getQuiz, submitQuiz };
