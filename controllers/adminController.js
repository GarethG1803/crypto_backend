const { auth, db } = require('../config/firebase');

// GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  try {
    const usersSnap = await db.collection('users').get();
    const modulesSnap = await db.collection('modules').get();
    const progressSnap = await db.collection('progress').get();

    const totalUsers = usersSnap.size;
    const totalModules = modulesSnap.size;

    // Average quiz score
    const quizScores = progressSnap.docs
      .map(doc => doc.data().quizScore)
      .filter(s => s != null);
    const avgQuizScore = quizScores.length > 0
      ? Math.round(quizScores.reduce((sum, s) => sum + s, 0) / quizScores.length)
      : 0;

    // Active users in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    const activeUsers = usersSnap.docs.filter(doc => {
      const data = doc.data();
      return data.lastActiveDate && data.lastActiveDate >= sevenDaysAgoStr;
    }).length;

    res.json({ totalUsers, totalModules, avgQuizScore, activeUsers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/users/:uid
const getUserDetail = async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const progressSnap = await db.collection('progress')
      .where('userId', '==', req.params.uid)
      .get();
    const progress = progressSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const achievementsSnap = await db.collection('achievements')
      .where('userId', '==', req.params.uid)
      .get();
    const achievements = achievementsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({
      uid: userDoc.id,
      ...userDoc.data(),
      progress,
      achievements,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/admin/users/:uid
const updateUser = async (req, res) => {
  const { name, points, level, isAdmin } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (points !== undefined) updates.points = points;
  if (level !== undefined) updates.level = level;
  if (isAdmin !== undefined) updates.isAdmin = isAdmin;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  try {
    await db.collection('users').doc(req.params.uid).update(updates);
    if (name !== undefined) {
      await auth.updateUser(req.params.uid, { displayName: name });
    }
    res.json({ message: 'User updated', updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/admin/users/:uid
const deleteUser = async (req, res) => {
  const { uid } = req.params;
  try {
    // Delete from Firebase Auth
    await auth.deleteUser(uid);

    // Delete Firestore user doc
    await db.collection('users').doc(uid).delete();

    // Clean up progress
    const progressSnap = await db.collection('progress')
      .where('userId', '==', uid)
      .get();
    const batch1 = db.batch();
    progressSnap.docs.forEach(doc => batch1.delete(doc.ref));
    if (progressSnap.size > 0) await batch1.commit();

    // Clean up achievements
    const achievementsSnap = await db.collection('achievements')
      .where('userId', '==', uid)
      .get();
    const batch2 = db.batch();
    achievementsSnap.docs.forEach(doc => batch2.delete(doc.ref));
    if (achievementsSnap.size > 0) await batch2.commit();

    // Clean up simulator
    await db.collection('simulator').doc(uid).delete();

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/modules
const getAllModulesAdmin = async (req, res) => {
  try {
    const modulesSnap = await db.collection('modules').orderBy('order').get();
    const progressSnap = await db.collection('progress')
      .where('lessonCompleted', '==', true)
      .get();

    // Count completions per module
    const completionCounts = {};
    progressSnap.docs.forEach(doc => {
      const moduleId = doc.data().moduleId;
      completionCounts[moduleId] = (completionCounts[moduleId] || 0) + 1;
    });

    const modules = modulesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      completions: completionCounts[doc.id] || 0,
    }));

    res.json(modules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/modules
const createModule = async (req, res) => {
  const { title, description, difficulty, category, duration, rewardPoints, order, content } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    // Generate a URL-friendly ID from the title
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const moduleData = {
      title: title.trim(),
      description: (description || '').trim(),
      difficulty: difficulty || 'beginner',
      category: (category || '').trim(),
      duration: (duration || '').trim(),
      rewardPoints: rewardPoints ?? 100,
      quizQuestionCount: 0,
      order: order ?? 0,
      content: content || [],
    };

    await db.collection('modules').doc(id).set(moduleData);
    res.status(201).json({ message: 'Module created', id, ...moduleData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/admin/modules/:id
const updateModule = async (req, res) => {
  const { title, description, difficulty, rewardPoints, duration, order } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (difficulty !== undefined) updates.difficulty = difficulty;
  if (rewardPoints !== undefined) updates.rewardPoints = rewardPoints;
  if (duration !== undefined) updates.duration = duration;
  if (order !== undefined) updates.order = order;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  try {
    await db.collection('modules').doc(req.params.id).update(updates);
    res.json({ message: 'Module updated', updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/admin/modules/:id/content
const updateModuleContent = async (req, res) => {
  const { content } = req.body;
  if (!Array.isArray(content)) {
    return res.status(400).json({ error: 'content must be an array' });
  }
  try {
    await db.collection('modules').doc(req.params.id).update({ content });
    res.json({ message: 'Module content updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/modules/:id/quiz
const getModuleQuiz = async (req, res) => {
  try {
    const snapshot = await db.collection('quizzes')
      .where('moduleId', '==', req.params.id)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ questions: [] });
    }

    const quiz = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/admin/modules/:id/quiz
const saveModuleQuiz = async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) {
    return res.status(400).json({ error: 'questions must be an array' });
  }

  try {
    const moduleId = req.params.id;
    const quizId = `quiz-${moduleId}`;

    await db.collection('quizzes').doc(quizId).set({
      moduleId,
      questions,
    });

    // Update quizQuestionCount on the module
    await db.collection('modules').doc(moduleId).update({
      quizQuestionCount: questions.length,
    });

    res.json({ message: 'Quiz saved', id: quizId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/scores
const getAllScores = async (req, res) => {
  try {
    const progressSnap = await db.collection('progress').get();
    const usersSnap = await db.collection('users').get();
    const modulesSnap = await db.collection('modules').get();

    const usersMap = {};
    usersSnap.docs.forEach(doc => {
      usersMap[doc.id] = doc.data().name || doc.data().email || doc.id;
    });

    const modulesMap = {};
    modulesSnap.docs.forEach(doc => {
      modulesMap[doc.id] = doc.data().title || doc.id;
    });

    const scores = progressSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userName: usersMap[data.userId] || data.userId,
        moduleId: data.moduleId,
        moduleTitle: modulesMap[data.moduleId] || data.moduleId,
        lessonCompleted: data.lessonCompleted || false,
        quizCompleted: data.quizCompleted || false,
        quizScore: data.quizScore,
        completedAt: data.completedAt || null,
      };
    });

    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/admin/modules/:id
const deleteModule = async (req, res) => {
  const { id } = req.params;
  try {
    const moduleDoc = await db.collection('modules').doc(id).get();
    if (!moduleDoc.exists) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Delete the module
    await db.collection('modules').doc(id).delete();

    // Clean up related quiz
    const quizDoc = await db.collection('quizzes').doc(`quiz-${id}`).get();
    if (quizDoc.exists) await db.collection('quizzes').doc(`quiz-${id}`).delete();

    // Clean up related progress
    const progressSnap = await db.collection('progress')
      .where('moduleId', '==', id)
      .get();
    if (progressSnap.size > 0) {
      const batch = db.batch();
      progressSnap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    res.json({ message: 'Module deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/admin/scores/:progressId
const resetUserProgress = async (req, res) => {
  try {
    const docRef = db.collection('progress').doc(req.params.progressId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Progress record not found' });
    }
    await docRef.delete();
    res.json({ message: 'Progress reset' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserDetail,
  updateUser,
  deleteUser,
  getAllModulesAdmin,
  createModule,
  updateModule,
  updateModuleContent,
  deleteModule,
  getModuleQuiz,
  saveModuleQuiz,
  getAllScores,
  resetUserProgress,
};
