const express = require('express');
const router = express.Router();
const { q } = require('../db');
const { analyzePortfolio, generateSmartQuestions } = require('../services/ai');
const { levelLabel: rubricLevelLabel } = require('../rubrics/mainRubric');

// GET /api/evaluations — list all evaluations with student info
router.get('/', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    res.json(await q.allEvaluations(req.user.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/evaluations/analyze
router.post('/analyze', async (req, res) => {
  const { student_id, instructor_answers, rubric_id, date_range } = req.body;
  if (!student_id) return res.status(400).json({ error: 'student_id required' });
  if (!rubric_id) return res.status(400).json({ error: 'rubric_id required' });

  const student = await q.student(student_id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  let rubric = await q.rubric(rubric_id);
  if (!rubric) return res.status(404).json({ error: 'Rubric not found' });

  // Criteria the instructor chose in the workspace (all of them by default).
  const selected = date_range?.selectedCriteriaIndices;
  if (Array.isArray(selected) && selected.length > 0) {
    rubric = { ...rubric, criteria: (rubric.criteria || []).filter((_, i) => selected.includes(i)) };
  }

  const files = await q.studentFiles(student_id);

  try {
    const draft = await analyzePortfolio(student.name, files, instructor_answers || {}, student.gender || 'female', rubric);
    const ev = await q.upsertEvaluation(student_id, draft, draft.score ?? null, rubric_id);
    const smartQuestions = await generateSmartQuestions(draft, student.name, student.gender || 'female');
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

// DELETE /api/evaluations/:id
router.delete('/:id', async (req, res) => {
  try {
    await q.deleteEvaluation(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/evaluations/:id/export — return styled HTML for client-side print-to-PDF
router.post('/:id/export', async (req, res) => {
  const ev = await q.getEvaluation(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Evaluation not found' });

  const student = await q.student(ev.student_id);
  const draft = ev.draft_json || {};
  let rubricName = draft.rubricName || null;
  if (!rubricName && ev.rubric_id) rubricName = (await q.rubric(ev.rubric_id))?.name || null;
  const html = buildExportHtml(student, draft, ev, rubricName);

  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildExportHtml(student, draft, ev, rubricName) {
  const today = new Date().toLocaleDateString('he-IL');
  const categories = draft.categories || [];
  // Drafts saved from the editor keep channel levels as { lessonPlan: { level } }.
  const lpLevelOf = c => c.lessonPlanLevel || c.lessonPlan?.level || null;
  const obLevelOf = c => c.observationLevel || c.observation?.level || null;
  const hasScores = categories.some(c => c.score !== null && c.score !== undefined && c.score !== '');
  const fmt = n => (Math.round(n * 10) / 10).toString();

  const scoreTable = hasScores ? `
    <table class="score-table">
      <thead><tr><th>קריטריון הערכה</th><th>משקל</th><th>ציון (0–100)</th><th>ציון משוקלל</th></tr></thead>
      <tbody>
        ${categories.map((c, i) => {
          const has = c.score !== null && c.score !== undefined && c.score !== '';
          return `<tr><td>${i + 1}. ${escapeHtml(c.name)}</td><td>${escapeHtml(c.weight)}%</td><td>${has ? escapeHtml(c.score) : '—'}</td><td>${has ? fmt(Number(c.score) * Number(c.weight) / 100) : '—'}</td></tr>`;
        }).join('')}
        <tr class="total"><td>ציון סופי מסכם בהתנסות המעשית</td><td>100%</td><td>—</td><td>${escapeHtml(draft.score ?? '—')}</td></tr>
      </tbody>
    </table>` : '';

  const cats = categories.map((c, i) => {
    const lp = lpLevelOf(c);
    const ob = obLevelOf(c);
    const inds = (c.indicators || []).filter(ind => ind.level || ind.note);
    return `
    <div class="criterion">
      <div class="criterion-header">
        <span class="num">${i + 1}.</span>
        <strong>${escapeHtml(c.name)}</strong>
        <span class="level">${escapeHtml(levelLabel(c.overallLevel))}${c.score !== null && c.score !== undefined && c.score !== '' ? ` · ${escapeHtml(c.score)}/100` : ''} · ${escapeHtml(c.weight)}%</span>
      </div>
      ${lp || ob ? `<div class="channels">${lp ? `<span>📘 מערך: ${escapeHtml(levelLabel(lp))}</span>` : ''}${ob ? `<span>🎯 צפייה: ${escapeHtml(levelLabel(ob))}</span>` : ''}</div>` : ''}
      <p>${escapeHtml(c.balance || '')}</p>
      ${inds.length ? `<ul class="indicators">${inds.map(ind => `<li><b>${escapeHtml(ind.id)} ${escapeHtml(ind.name || '')}</b> — ${escapeHtml(levelLabel(ind.level))}${ind.note ? `: ${escapeHtml(ind.note)}` : ''}</li>`).join('')}</ul>` : ''}
    </div>`;
  }).join('');

  const listHtml = items => (items || []).length ? `<ul>${items.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>` : '<p style="color:#687476">—</p>';
  const strengthsGoals = (draft.strengths?.length || draft.goals?.length) ? `
    <table class="sg-table">
      <thead><tr><th>חוזקות מרכזיות הבאות לידי ביטוי בעדויות לאורך הסמסטר</th><th>יעדים מרכזיים להמשך ההתפתחות המקצועית</th></tr></thead>
      <tbody><tr><td>${listHtml(draft.strengths)}</td><td>${listHtml(draft.goals)}</td></tr></tbody>
    </table>` : '';

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: 'Heebo', 'Helvetica Neue', Arial, sans-serif; color: #293233; padding: 48px 56px; font-size: 13px; line-height: 1.7; max-width: 800px; margin: 0 auto; }
  @media print { body { padding: 0; } @page { margin: 20mm 18mm; size: A4; } }
  .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1fb6c1; padding-bottom: 16px; margin-bottom: 24px; }
  .logo { font-size: 18px; font-weight: 700; color: #1a2a63; }
  .meta { font-size: 11px; color: #687476; text-align: left; }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; }
  h2 { font-size: 15px; font-weight: 700; margin: 24px 0 10px; color: #1a2a63; }
  .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; font-size: 12px; background: #f4f9fa; padding: 12px 14px; border-radius: 4px; margin-bottom: 24px; }
  .criterion { margin-bottom: 20px; }
  .criterion-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
  .num { color: #687476; }
  .level { margin-right: auto; font-size: 11px; color: #1a2a63; font-weight: 600; }
  .channels { font-size: 11px; color: #687476; margin-bottom: 4px; display: flex; gap: 16px; }
  .indicators { margin: 6px 0 0; padding-inline-start: 18px; font-size: 11.5px; color: #4a5658; }
  .indicators li { margin-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
  th, td { border: 1px solid #d5dddf; padding: 6px 8px; text-align: right; vertical-align: top; }
  th { background: #f4f9fa; font-weight: 600; }
  .score-table td:not(:first-child), .score-table th:not(:first-child) { text-align: center; width: 90px; }
  .score-table tr.total td { font-weight: 700; background: #eef8f9; }
  .sg-table td { width: 50%; }
  .sg-table ul { margin: 0; padding-inline-start: 18px; }
  .summary-box { background: #eef8f9; border-right: 3px solid #1a2a63; padding: 14px 16px; border-radius: 4px; margin-top: 24px; }
  .score { font-size: 28px; font-weight: 700; color: #1a2a63; }
  .sig { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 28px; margin-top: 40px; border-top: 1px solid #e2e7e8; padding-top: 16px; font-size: 11px; color: #687476; }
  .sig-line { border-bottom: 1px solid #293233; height: 28px; margin-bottom: 6px; }
  .footer { text-align: center; font-size: 10px; color: #9aa0ad; margin-top: 32px; border-top: 1px solid #edf0f1; padding-top: 12px; }
</style>
</head>
<body>
  <div class="header">
    <div><div class="logo">המכללה האקדמית להוראה</div><div style="font-size:11px;color:#687476">בית הספר להכשרת מורים · התנסות מעשית</div></div>
    <div class="meta">תאריך: ${today}<br/>מס׳ אסמכתא: HE-${new Date().getFullYear()}-${escapeHtml(ev.id.slice(-4))}</div>
  </div>
  <div style="font-size:11px;color:#687476;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">${escapeHtml(rubricName || 'הערכת התנסות מעשית')}</div>
  <h1>הערכת סטודנט/ית: ${escapeHtml(student.name)}</h1>
  <div class="fields">
    <div><span style="color:#687476">בית ספר מאמן:</span> ${escapeHtml(student.school || '—')}</div>
    <div><span style="color:#687476">כיתה:</span> ${escapeHtml(student.grade || '—')}</div>
    <div><span style="color:#687476">מסלול:</span> ${escapeHtml(student.subject_track || '—')}</div>
    <div><span style="color:#687476">מחוון:</span> ${escapeHtml(rubricName || 'הערכת סוף שנה')} — 100 נק׳</div>
  </div>
  ${scoreTable ? `<h2>טופס שקלול ציון מסכם</h2>${scoreTable}` : ''}
  <h2>הערכה מנומקת לפי קריטריונים</h2>
  ${cats}
  ${strengthsGoals}
  <div class="summary-box">
    <strong>סיכום והמלצות</strong>
    <p>${escapeHtml(draft.summary || '')}</p>
    <div style="display:flex;align-items:center;gap:18px;margin-top:12px">
      <div><div style="font-size:10px;color:#687476;text-transform:uppercase">ציון מסכם</div><div class="score">${escapeHtml(draft.score ?? '—')}<span style="font-size:14px;font-weight:400;color:#687476"> / 100</span></div></div>
      <div style="width:1px;height:36px;background:#cfc7b3"></div>
      <div><div style="font-size:10px;color:#687476;text-transform:uppercase">הערכה כללית</div><div style="font-size:16px;font-weight:600;margin-top:4px">${escapeHtml(levelLabel(draft.overallLevel))}</div></div>
    </div>
  </div>
  <div class="sig">
    <div><div class="sig-line"></div>תאריך</div>
    <div><div class="sig-line"></div>חתימת המדריכה הפדגוגית</div>
    <div><div class="sig-line"></div>חתימת הסטודנט/ית</div>
  </div>
  <div class="footer">מסמך זה הופק באמצעות כלי ההערכה הפדגוגית · עמוד 1 מתוך 1</div>
</body>
</html>`;
}

function levelLabel(l) {
  return l ? rubricLevelLabel(l) : '—';
}

module.exports = router;
