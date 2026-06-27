const express = require('express');
const router = express.Router();
const { q, supabase } = require('../db');

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// GET /api/students
router.get('/', requireAuth, async (req, res) => {
  try {
    res.json(await q.allStudents(req.user.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/students/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const student = await q.studentWithCycles(req.params.id, req.user.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/students/cycles/:cycleId/topic
router.put('/cycles/:cycleId/topic', requireAuth, async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic required' });
    await q.updateCycleTopic(req.params.cycleId, topic);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/students
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, school, grade, subject_track, gender } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    const id = 's_' + Date.now();
    const initials = name.replace(/[^א-ת]/g, '').slice(0, 2) || name.slice(0, 2);
    const resolvedGender = gender === 'male' ? 'male' : 'female';

    const { error: insertError } = await supabase.from('students').insert({ id, name, school: school || '', grade: grade || '', subject_track: subject_track || '', initials, gender: resolvedGender, instructor_id: req.user.id });
    if (insertError) throw insertError;
    await q.seedDefaultCyclesForStudent(id, subject_track);

    const created = await q.student(id, req.user.id);
    if (!created) throw new Error('Student was not found after insert');
    res.json(created);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const student = await q.student(req.params.id, req.user.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    await q.deleteStudent(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/students/import — bulk import from CSV text
router.post('/import', requireAuth, async (req, res) => {
  try {
    const { csv } = req.body;
    if (!csv || typeof csv !== 'string') return res.status(400).json({ error: 'csv string required' });

    const lines = csv.trim().split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return res.status(400).json({ error: 'CSV must have header + at least one row' });

    const header = lines[0].split(',').map(h => h.trim());
    const nameCol   = header.findIndex(h => /שם/.test(h)      || /name/i.test(h));
    const schoolCol = header.findIndex(h => /בית.?ספר/.test(h) || /school/i.test(h));
    const gradeCol  = header.findIndex(h => /כיתה/.test(h)    || /grade/i.test(h));
    const trackCol  = header.findIndex(h => /מסלול/.test(h)   || /track/i.test(h) || /subject/i.test(h));
    const genderCol = header.findIndex(h => /מגדר/.test(h)    || /gender/i.test(h));

    if (nameCol === -1) return res.status(400).json({ error: 'CSV must have a "שם" column' });

    const rows = [];
    const skipped = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const name = cols[nameCol];
      if (!name) { skipped.push(i + 1); continue; }

      const initials = name.replace(/[^א-תa-zA-Z]/g, '').slice(0, 2) || name.slice(0, 2);
      const rawGender = genderCol >= 0 ? (cols[genderCol] || '') : '';
      const gender = rawGender === 'male' || rawGender === 'זכר' ? 'male' : 'female';
      rows.push({
        id: 's_' + Date.now() + '_' + i,
        name,
        school:        schoolCol >= 0 ? (cols[schoolCol] || '') : '',
        grade:         gradeCol  >= 0 ? (cols[gradeCol]  || '') : '',
        subject_track: trackCol  >= 0 ? (cols[trackCol]  || '') : '',
        status: 'not_started',
        initials,
        gender,
      });
    }

    if (rows.length === 0) return res.status(400).json({ error: 'No valid rows found' });

    await q.bulkInsertStudents(rows, req.user.id);
    res.json({ imported: rows.length, skipped: skipped.length, students: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
