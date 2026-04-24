const { db } = require('../config/firebase');

const getAllModules = async (req, res) => {
  try {
    const snapshot = await db.collection('modules').orderBy('order').get();
    const modules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(modules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getModuleById = async (req, res) => {
  try {
    const doc = await db.collection('modules').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllModules, getModuleById };
