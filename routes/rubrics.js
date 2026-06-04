const express = require('express');
const router = express.Router();
const { q } = require('../db');

// GET /api/rubrics
router.get('/', async (_req, res) => {
  res.json(await q.allRubrics());
});

// GET /api/rubrics/:id
router.get('/:id', async (req, res) => {
  const r = await q.rubric(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json(r);
});

// POST /api/rubrics
router.post('/', async (req, res) => {
  const { name, description, semester, total_points, criteria } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  if (!Array.isArray(criteria)) return res.status(400).json({ error: 'criteria must be an array' });

  const weightSum = criteria.reduce((a, c) => a + (c.weight || 0), 0);
  if (criteria.length > 0 && weightSum !== 100) {
    return res.status(400).json({ error: `סך המשקלים חייב להיות 100 (כרגע: ${weightSum})` });
  }

  try {
    const rubric = await q.createRubric({ name, description, semester, total_points, criteria, instructor_id: req.user?.id || null });
    res.status(201).json(rubric);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/rubrics/:id
router.put('/:id', async (req, res) => {
  const r = await q.rubric(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });

  const { name, description, semester, total_points, criteria } = req.body;

  if (Array.isArray(criteria) && criteria.length > 0) {
    const weightSum = criteria.reduce((a, c) => a + (c.weight || 0), 0);
    if (weightSum !== 100) {
      return res.status(400).json({ error: `סך המשקלים חייב להיות 100 (כרגע: ${weightSum})` });
    }
  }

  try {
    await q.updateRubric(req.params.id, { name, description, semester, total_points, criteria });
    res.json(await q.rubric(req.params.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/rubrics/:id
router.delete('/:id', async (req, res) => {
  await q.deleteRubric(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
