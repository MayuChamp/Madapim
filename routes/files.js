const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { q, supabase, BUCKET } = require('../db');
const { parseFile } = require('../services/fileParser');

// Store in memory — files go straight to Supabase Storage, not disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.docx', '.doc', '.pdf', '.txt'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('סוג קובץ לא נתמך'));
    }
  },
});

// POST /api/files/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { student_id, cycle_id, stage_key, description, material_date } = req.body;
    if (!student_id) return res.status(400).json({ error: 'student_id required' });

    const isFileless = !req.file;
    let parsed_text = '';
    let original_name = description || 'מסמך_נוסף';
    let stored_path = null;
    let file_type = 'text';
    const fileId = 'f_' + Date.now();

    if (!isFileless) {
      try {
        parsed_text = await parseFile(req.file.buffer, req.file.originalname);
      } catch (err) {
        console.error('Parse error:', err.message);
      }

      original_name = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      file_type = path.extname(req.file.originalname).slice(1).toLowerCase();

      const storagePath = `${student_id}/${fileId}.${file_type}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype });

      if (uploadError) {
        console.error('Storage upload error:', uploadError.message);
      } else {
        stored_path = storagePath;
      }
    }

    const fileRecord = {
      id: fileId,
      student_id,
      cycle_id: cycle_id || null,
      stage_key: stage_key || null,
      original_name,
      stored_path,
      parsed_text,
      file_type,
      description: description || null,
      material_date: material_date || null,
    };

    await q.saveFile(fileRecord);

    if (cycle_id && stage_key) {
      await q.updateStageFile(cycle_id, stage_key);
    }

    const student = await q.student(student_id);
    if (student?.status === 'not_started') {
      await q.updateStudentStatus(student_id, 'pending');
    }

    res.json({
      id: fileRecord.id,
      original_name: fileRecord.original_name,
      file_type: fileRecord.file_type,
      description: fileRecord.description,
      parsed: parsed_text.length > 0,
      chars: parsed_text.length,
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/files/:fileId
router.delete('/:fileId', async (req, res) => {
  try {
    await q.deleteFile(req.params.fileId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/files/:studentId
router.get('/:studentId', async (req, res) => {
  const files = await q.studentFiles(req.params.studentId);
  res.json(files.map(f => ({
    id: f.id,
    original_name: f.original_name,
    file_type: f.file_type,
    cycle_id: f.cycle_id,
    stage_key: f.stage_key,
    uploaded_at: f.uploaded_at,
    material_date: f.material_date || null,
    has_text: (f.parsed_text || '').length > 20,
    text_preview: (f.parsed_text || '').slice(0, 1500) || null,
  })));
});

module.exports = router;
