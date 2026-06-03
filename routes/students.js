const express = require('express');
const router = express.Router();
const { q } = require('../db');

// GET /api/students
router.get('/', (req, res) => {
  const students = q.allStudents();
  // Attach progress counts
  const enriched = students.map(s => {
    const full = q.studentWithCycles(s.id);
    return {
      ...s,
      lessonProgress: full.lessonProgress,
      observationProgress: full.observationProgress,
      docs: full.cycles.reduce((acc, c) => acc + (c.files?.length || 0), 0),
    };
  });
  res.json(enriched);
});

// GET /api/students/:id
router.get('/:id', (req, res) => {
  const student = q.studentWithCycles(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

// POST /api/students
router.post('/', (req, res) => {
  const { name, school, grade, subject_track } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const id = 's_' + Date.now();
  const initials = name.replace(/[^א-ת]/g, '').slice(0, 2) || name.slice(0, 2);
  require('../db').db.prepare(`
    INSERT INTO students (id, name, school, grade, subject_track, initials)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, school || '', grade || '', subject_track || '', initials);
  res.json(q.student(id));
});

// POST /api/students/import — bulk import from CSV text
// Body: { csv: "שם,בית ספר,כיתה,מסלול\nמשה לוי,יסודי א,ד,מתמטיקה\n..." }
router.post('/import', (req, res) => {
  const { csv } = req.body;
  if (!csv || typeof csv !== 'string') return res.status(400).json({ error: 'csv string required' });

  const lines = csv.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return res.status(400).json({ error: 'CSV must have header + at least one row' });

  const header = lines[0].split(',').map(h => h.trim());
  const nameCol = header.findIndex(h => /שם/.test(h) || /name/i.test(h));
  const schoolCol = header.findIndex(h => /בית.?ספר/.test(h) || /school/i.test(h));
  const gradeCol = header.findIndex(h => /כיתה/.test(h) || /grade/i.test(h));
  const trackCol = header.findIndex(h => /מסלול/.test(h) || /track/i.test(h) || /subject/i.test(h));

  if (nameCol === -1) return res.status(400).json({ error: 'CSV must have a "שם" column' });

  const rows = [];
  const skipped = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const name = cols[nameCol];
    if (!name) { skipped.push(i + 1); continue; }

    const initials = name.replace(/[^א-תa-zA-Z]/g, '').slice(0, 2) || name.slice(0, 2);
    rows.push({
      id: 's_' + Date.now() + '_' + i,
      name,
      school: schoolCol >= 0 ? (cols[schoolCol] || '') : '',
      grade:  gradeCol  >= 0 ? (cols[gradeCol]  || '') : '',
      subject_track: trackCol >= 0 ? (cols[trackCol] || '') : '',
      status: 'not_started',
      initials,
    });
  }

  if (rows.length === 0) return res.status(400).json({ error: 'No valid rows found' });

  require('../db').q.bulkInsertStudents(rows);
  res.json({ imported: rows.length, skipped: skipped.length, students: rows });
});

module.exports = router;
