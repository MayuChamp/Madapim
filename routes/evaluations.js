const express = require('express');
const router = express.Router();
const { q } = require('../db');
const { analyzePortfolio, generateSmartQuestions } = require('../services/ai');

// POST /api/evaluations/analyze
router.post('/analyze', async (req, res) => {
  const { student_id, instructor_answers } = req.body;
  if (!student_id) return res.status(400).json({ error: 'student_id required' });

  const student = await q.student(student_id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const files = await q.studentFiles(student_id);

  try {
    const draft = await analyzePortfolio(student.name, files, instructor_answers || {});
    const ev = await q.upsertEvaluation(student_id, draft, draft.score || null);
    const smartQuestions = await generateSmartQuestions(draft, student.name);
    await q.updateStudentStatus(student_id, 'in_progress');

    res.json({ evaluation_id: ev.id, draft, smart_questions: smartQuestions });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: err.message || 'שגיאה בניתוח ה-AI' });
  }
});

// GET /api/evaluations/:studentId
router.get('/:studentId', async (req, res) => {
  const ev = await q.evaluation(req.params.studentId);
  if (!ev) return res.status(404).json({ error: 'No evaluation found' });
  res.json({
    ...ev,
    draft_json:         ev.draft_json         || {},
    instructor_answers: ev.instructor_answers || {},
  });
});

// PUT /api/evaluations/:id
router.put('/:id', async (req, res) => {
  try {
    const { draft_json, instructor_answers, score, status } = req.body;
    const updates = {};
    if (draft_json !== undefined)         updates.draft_json         = draft_json;
    if (instructor_answers !== undefined) updates.instructor_answers = instructor_answers;
    if (score !== undefined)              updates.score              = score;
    if (status !== undefined)             updates.status             = status;

    await q.updateEvaluation(req.params.id, updates);
    const ev = await q.getEvaluation(req.params.id);
    res.json({
      ...ev,
      draft_json:         ev.draft_json         || {},
      instructor_answers: ev.instructor_answers || {},
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/evaluations/:id/export — generate PDF
router.post('/:id/export', async (req, res) => {
  const ev = await q.getEvaluation(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Evaluation not found' });

  const student = await q.student(ev.student_id);
  const draft = ev.draft_json || {};
  const html = buildExportHtml(student, draft, ev);

  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="evaluation-${student.name.replace(/\s/g, '_')}.pdf"`,
    });
    res.send(pdf);
  } catch (err) {
    console.error('PDF export error:', err.message);
    res.set('Content-Type', 'text/html');
    res.send(html);
  }
});

function buildExportHtml(student, draft, ev) {
  const today = new Date().toLocaleDateString('he-IL');
  const cats = (draft.categories || []).map((c, i) => `
    <div class="criterion">
      <div class="criterion-header">
        <span class="num">${i + 1}.</span>
        <strong>${c.name}</strong>
        <span class="level">${c.overallLevel || ''} · ${c.weight}%</span>
      </div>
      ${c.lessonPlanLevel ? `<div class="channels"><span>📘 מערך: ${c.lessonPlanLevel}</span>${c.observationLevel ? `<span>🎯 צפייה: ${c.observationLevel}</span>` : ''}</div>` : ''}
      <p>${c.balance || ''}</p>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1f2c; padding: 48px 56px; font-size: 13px; line-height: 1.7; }
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e3a5f; padding-bottom: 16px; margin-bottom: 24px; }
  .logo { font-size: 18px; font-weight: 700; color: #1e3a5f; }
  .meta { font-size: 11px; color: #7a8295; text-align: left; }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; }
  .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; font-size: 12px; background: #f5f3ee; padding: 12px 14px; border-radius: 4px; margin-bottom: 24px; }
  .criterion { margin-bottom: 20px; }
  .criterion-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
  .num { color: #7a8295; }
  .level { margin-right: auto; font-size: 11px; color: #1e3a5f; font-weight: 600; }
  .channels { font-size: 11px; color: #7a8295; margin-bottom: 4px; display: flex; gap: 16px; }
  .summary-box { background: #f3f6fa; border-right: 3px solid #1e3a5f; padding: 14px 16px; border-radius: 4px; margin-top: 24px; }
  .score { font-size: 28px; font-weight: 700; color: #1e3a5f; }
  .sig { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 40px; border-top: 1px solid #e3ddd0; padding-top: 16px; font-size: 11px; color: #7a8295; }
  .sig-line { border-bottom: 1px solid #1a1f2c; height: 28px; margin-bottom: 6px; }
  .footer { text-align: center; font-size: 10px; color: #9aa0ad; margin-top: 32px; border-top: 1px solid #ebe8e0; padding-top: 12px; }
</style>
</head>
<body>
  <div class="header">
    <div><div class="logo">המכללה האקדמית להוראה</div><div style="font-size:11px;color:#7a8295">בית הספר להכשרת מורים · התנסות מעשית</div></div>
    <div class="meta">תאריך: ${today}<br/>מס׳ אסמכתא: HE-${new Date().getFullYear()}-${ev.id.slice(-4)}</div>
  </div>
  <div style="font-size:11px;color:#7a8295;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">הערכת התנסות מעשית · סוף שנה</div>
  <h1>הערכת סטודנט/ית: ${student.name}</h1>
  <div class="fields">
    <div><span style="color:#7a8295">בית ספר מאמן:</span> ${student.school || '—'}</div>
    <div><span style="color:#7a8295">כיתה:</span> ${student.grade || '—'}</div>
    <div><span style="color:#7a8295">מסלול:</span> ${student.subject_track || '—'}</div>
    <div><span style="color:#7a8295">מחוון:</span> הערכת סוף שנה — 100 נק׳</div>
  </div>
  ${cats}
  <div class="summary-box">
    <strong>סיכום והמלצות</strong>
    <p>${draft.summary || ''}</p>
    <div style="display:flex;align-items:center;gap:18px;margin-top:12px">
      <div><div style="font-size:10px;color:#7a8295;text-transform:uppercase">ציון מסכם</div><div class="score">${draft.score || '—'}<span style="font-size:14px;font-weight:400;color:#7a8295"> / 100</span></div></div>
      <div style="width:1px;height:36px;background:#cfc7b3"></div>
      <div><div style="font-size:10px;color:#7a8295;text-transform:uppercase">הערכה כללית</div><div style="font-size:16px;font-weight:600;margin-top:4px">${levelLabel(draft.overallLevel)}</div></div>
    </div>
  </div>
  <div class="sig">
    <div><div class="sig-line"></div>חתימת המדריך/ה הפדגוגי/ת</div>
    <div><div class="sig-line"></div>חתימת ראש החוג</div>
  </div>
  <div class="footer">מסמך זה הופק באמצעות כלי ההערכה הפדגוגית · עמוד 1 מתוך 1</div>
</body>
</html>`;
}

function levelLabel(l) {
  const map = { high: 'גבוהה', mid_high: 'בינונית-גבוהה', mid: 'בינונית', low_mid: 'בינונית-נמוכה' };
  return map[l] || l || '—';
}

module.exports = router;
