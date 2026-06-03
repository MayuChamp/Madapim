const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { q } = require('../db');
const { parseFile } = require('../services/fileParser');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '_' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.docx', '.doc', '.pdf', '.txt'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('סוג קובץ לא נתמך'));
    }
  },
});

// POST /api/files/upload
// Body fields: student_id, cycle_id (optional), stage_key (optional)
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { student_id, cycle_id, stage_key } = req.body;
  if (!student_id) return res.status(400).json({ error: 'student_id required' });

  let parsed_text = '';
  try {
    parsed_text = await parseFile(req.file.path, req.file.originalname);
  } catch (err) {
    console.error('Parse error:', err.message);
  }

  const fileRecord = {
    id: 'f_' + Date.now(),
    student_id,
    cycle_id: cycle_id || null,
    stage_key: stage_key || null,
    original_name: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
    stored_path: req.file.path,
    parsed_text,
    file_type: path.extname(req.file.originalname).slice(1).toLowerCase(),
  };

  q.saveFile(fileRecord);

  // Mark corresponding stage as done if cycle_id + stage_key provided
  if (cycle_id && stage_key) {
    q.updateStageFile(cycle_id, stage_key, fileRecord.id, null, null);
  }

  // Update student status to pending if it was not_started
  const student = q.student(student_id);
  if (student?.status === 'not_started') {
    q.updateStudentStatus(student_id, 'pending');
  }

  res.json({
    id: fileRecord.id,
    original_name: fileRecord.original_name,
    file_type: fileRecord.file_type,
    parsed: parsed_text.length > 0,
    chars: parsed_text.length,
  });
});

// GET /api/files/:studentId — list files for a student
router.get('/:studentId', (req, res) => {
  const files = q.studentFiles(req.params.studentId).map(f => ({
    id: f.id,
    original_name: f.original_name,
    file_type: f.file_type,
    cycle_id: f.cycle_id,
    stage_key: f.stage_key,
    uploaded_at: f.uploaded_at,
    has_text: (f.parsed_text || '').length > 20,
  }));
  res.json(files);
});

module.exports = router;
