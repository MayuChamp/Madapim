const express = require('express');
const router = express.Router();
const { q } = require('../db');

// GET /api/rubrics
router.get('/', (req, res) => {
  res.json(q.allRubrics());
});

// GET /api/rubrics/:id
router.get('/:id', (req, res) => {
  const r = q.rubric(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json(r);
});

// POST /api/rubrics
router.post('/', (req, res) => {
  const { name, description, semester, total_points, criteria } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  if (!Array.isArray(criteria)) return res.status(400).json({ error: 'criteria must be an array' });

  const weightSum = criteria.reduce((a, c) => a + (c.weight || 0), 0);
  if (criteria.length > 0 && weightSum !== 100) {
    return res.status(400).json({ error: `סך המשקלים חייב להיות 100 (כרגע: ${weightSum})` });
  }

  const instructor_id = req.user?.id || null;
  const rubric = q.createRubric({ name, description, semester, total_points, criteria, instructor_id });
  res.status(201).json(rubric);
});

// PUT /api/rubrics/:id
router.put('/:id', (req, res) => {
  const r = q.rubric(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });

  const { name, description, semester, total_points, criteria } = req.body;

  if (Array.isArray(criteria) && criteria.length > 0) {
    const weightSum = criteria.reduce((a, c) => a + (c.weight || 0), 0);
    if (weightSum !== 100) {
      return res.status(400).json({ error: `סך המשקלים חייב להיות 100 (כרגע: ${weightSum})` });
    }
  }

  q.updateRubric(req.params.id, { name, description, semester, total_points, criteria });
  res.json(q.rubric(req.params.id));
});

// DELETE /api/rubrics/:id
router.delete('/:id', (req, res) => {
  q.deleteRubric(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
