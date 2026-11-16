// ─── "השלמת מידע" — questions the instructor answers before the analysis ─────
// A quick scan of the portfolio (services/ai.js → prescanPortfolio) feeds these
// rules. Two groups, all tied to indicator codes of the selected rubric:
//
//   fixed        asked for every portfolio
//                  feedback  3.4  improvement in light of feedback
//                  conduct   4.3  professional conduct — a threshold condition,
//                                 so it is never pushed out by other questions
//                  mentor    —    the mentor teacher's view (triangulation)
//                  strength  —    the strength to highlight in the summary
//   conditional  only when the scan finds something
//                  gap           criterion 3: planning and execution ≥ 2 levels apart
//                  evidence      an indicator with fewer than two pieces of evidence
//                  requirements  4.1–4.2: lesson plans without a revision, missing reflections
//                  content       1.1: content inaccuracies in a plan or observation
//
// At most five questions: conditional ones first, by criterion weight, then the
// fixed ones in order (conduct always included). Weighing planning against
// execution is a per-instructor setting, not a question.

const { PERFORMANCE_LEVELS } = require('../rubrics/mainRubric');

const MAX_QUESTIONS = 5;
const LIMITED_LESSON_PLANS = 5;   // fewer lesson plans → the instructor is told the picture is narrow
const KIND_CAP  = { gap: 2, evidence: 2, requirements: 1, content: 1 };
const KIND_RANK = { gap: 0, requirements: 1, content: 2, evidence: 3 };
const LEVEL_RANK = { low_mid: 0, mid: 1, mid_high: 2, high: 3 };

// Indicators whose instructor input comes from a dedicated question.
const NOT_FOR_EVIDENCE_QUESTION = new Set(['3.4', '4.1', '4.2', '4.3']);

const PLAN_VS_EXECUTION = {
  execution: 'להעדיף את הביצוע בכיתה',
  balanced:  'איזון בין השניים',
  planning:  'להעדיף את התכנון',
};

const levelLabel = key => PERFORMANCE_LEVELS.find(l => l.key === key)?.label || key;

// Every indicator of the (already criteria-filtered) rubric, with its criterion.
function indicatorIndex(rubric) {
  const index = {};
  for (const c of rubric?.criteria || []) {
    for (const ind of c.indicators || []) {
      index[String(ind.id)] = { ...ind, id: String(ind.id), criterionId: c.id, weight: Number(c.weight) || 0 };
    }
  }
  return index;
}

// Distinct cycles with material, per track. Revisions and reflections are also
// counted by the scan, since files uploaded without a stage carry no stage key.
function portfolioCounts(files, scan) {
  const cyclesWith = (track, stage) => new Set(
    (files || [])
      .filter(f => f.cycle_id && f.track_type === track && (!stage || f.stage_key === stage))
      .map(f => f.cycle_id)
  ).size;
  const lessonPlans  = cyclesWith('lesson_plan');
  const observations = cyclesWith('observation');
  const scanned = n => (Number.isFinite(Number(n)) ? Math.max(0, Math.round(Number(n))) : 0);
  return {
    lessonPlans,
    observations,
    revisions:   Math.min(lessonPlans, Math.max(cyclesWith('lesson_plan', 'revision'), scanned(scan?.revisedLessonPlans))),
    reflections: Math.max(cyclesWith('observation', 'reflection'), scanned(scan?.reflections)),
  };
}

// ─── Fixed questions ─────────────────────────────────────────────────────────
function fixedQuestions({ name, v, ind }) {
  const qs = [];
  if (ind['3.4']) qs.push({
    id: 'fixed_feedback', kind: 'fixed', order: 1, codes: ['3.4'],
    topic: 'שיפור לאור משוב',
    question: `לאורך הסמסטר, באיזו מידה ${name} ${v('יישם', 'יישמה')} את ההערות משיחות המשוב?`,
    options: [
      { value: 'full',     label: 'יישום מלא ועצמאי, ואף זיהוי עצמי של נקודות לשיפור' },
      { value: 'most',     label: 'יישום של רוב ההערות' },
      { value: 'partial',  label: 'יישום חלקי או איטי' },
      { value: 'repeated', label: 'אותן נקודות חזרו משיעור לשיעור' },
    ],
    note: { placeholder: 'דוגמה להערה אחת שיושמה, או שלא יושמה (רשות)' },
  });
  if (ind['4.3']) qs.push({
    id: 'fixed_conduct', kind: 'fixed', order: 2, mandatory: true, codes: ['4.3'],
    topic: 'התנהלות מקצועית · תנאי סף',
    question: `האם היו אירועים בהתנהלות המקצועית של ${name} שיש להביא בחשבון?`,
    options: [
      { value: 'none',          label: 'לא, ההתנהלות תקינה' },
      { value: 'absences',      label: 'היעדרויות או איחורים בלי עדכון מראש' },
      { value: 'communication', label: 'קושי בתקשורת עם המורה המאמנ/ת או עם הצוות' },
      { value: 'other',         label: 'אחר' },
    ],
    note: { placeholder: 'תאר/י בקצרה', requiredFor: ['absences', 'communication', 'other'] },
  });
  qs.push({
    id: 'fixed_mentor', kind: 'fixed', order: 3, codes: [],
    topic: 'עמדת המורה המאמנ/ת · הצלבת עדויות',
    question: `איך המורה המאמנ/ת מעריכ/ה את ${name}?`,
    options: [
      ...PERFORMANCE_LEVELS.map(l => ({ value: l.key, label: l.label })),
      { value: 'not_collected', label: 'לא נאספה עמדה' },
    ],
    note: { placeholder: 'ציטוט או סיכום קצר (רשות)' },
  });
  qs.push({
    id: 'fixed_strength', kind: 'fixed', order: 4, codes: [],
    topic: 'נקודת חוזק',
    question: `מה נקודת החוזק הבולטת ביותר של ${name}, שכדאי להבליט במשוב המסכם?`,
    options: null,
    note: { placeholder: 'נקודת החוזק', primary: true },
    indicatorOptions: Object.values(ind).map(i => ({ id: i.id, name: i.name })),
  });
  return qs;
}

// ─── Conditional questions ───────────────────────────────────────────────────
function gapQuestions({ ind }, scan) {
  const out = [];
  for (const s of scan?.indicators || []) {
    const meta = ind[s.id];
    if (!meta || !s.id.startsWith('3.')) continue;
    const p = LEVEL_RANK[s.planLevel];
    const e = LEVEL_RANK[s.executionLevel];
    if (p === undefined || e === undefined || Math.abs(p - e) < 2) continue;
    const planHigher = p > e;
    const sources = [s.planSource && `מערך: ${s.planSource}`, s.executionSource && `תצפית: ${s.executionSource}`].filter(Boolean);
    out.push({
      id: `gap_${s.id}`, kind: 'gap', codes: [s.id], weight: meta.weight, sortKey: -Math.abs(p - e),
      topic: `פער בין תכנון לביצוע · ${meta.name}`,
      context: sources.length ? sources.join(' · ') : null,
      question: `התכנון של "${meta.name}" דורג ברמה "${levelLabel(s.planLevel)}", והביצוע בכיתה דורג ברמה "${levelLabel(s.executionLevel)}". מה מסביר את הפער?`,
      options: planHigher ? [
        { value: 'not_representative', label: 'השיעור שנצפה לא היה מייצג (נסיבות חריגות בכיתה)' },
        { value: 'real_difficulty',    label: 'קושי אמיתי ביישום, שחוזר גם בשיעורים אחרים' },
        { value: 'narrowed',           label: 'הפער הצטמצם בתצפיות מאוחרות יותר' },
        { value: 'other',              label: 'אחר' },
      ] : [
        { value: 'not_representative', label: 'השיעור שנצפה לא היה מייצג (נסיבות חריגות בכיתה)' },
        { value: 'writing_gap',        label: 'הכתיבה לא משקפת את היכולת בכיתה' },
        { value: 'narrowed',           label: 'הפער הצטמצם במערכים מאוחרים יותר' },
        { value: 'other',              label: 'אחר' },
      ],
      note: { placeholder: 'פרט/י (רשות)' },
    });
  }
  return out;
}

function evidenceQuestions({ name, ind }, scan) {
  const out = [];
  for (const s of scan?.indicators || []) {
    const meta = ind[s.id];
    if (!meta || NOT_FOR_EVIDENCE_QUESTION.has(s.id)) continue;
    const count = Number(s.evidenceCount);
    if (!Number.isFinite(count) || count >= 2) continue;
    const lookFor = typeof s.lookFor === 'string' && s.lookFor.trim() ? s.lookFor.trim().replace(/[?.]+$/, '') : null;
    out.push({
      id: `evidence_${s.id}`, kind: 'evidence', codes: [s.id], weight: meta.weight, sortKey: count,
      topic: `אין מספיק עדויות · ${meta.name}`,
      context: `${count === 0 ? 'לא נמצאה בתיק עדות' : 'נמצאה בתיק עדות אחת בלבד'} לתת-המדד "${meta.name}".${!lookFor && meta.levels?.mid_high ? ` ברמה "טוב / שולט": ${meta.levels.mid_high}` : ''}`,
      question: lookFor
        ? `אין מספיק עדויות לגבי ${meta.name}. האם ראית את ${name} ${lookFor}?`
        : `אין מספיק עדויות לגבי ${meta.name}. האם ראית עדויות לכך אצל ${name}?`,
      options: [
        { value: 'yes_many',       label: 'כן, כמה פעמים' },
        { value: 'yes_once',       label: 'כן, פעם אחת' },
        { value: 'no_despite',     label: 'לא, למרות שהייתה הזדמנות' },
        { value: 'no_opportunity', label: 'לא הייתה הזדמנות לראות' },
      ],
      note: { placeholder: 'תאר/י מקרה אחד', requiredFor: ['yes_many', 'yes_once'] },
      skipMarksInsufficient: true,
    });
  }
  return out;
}

// No minimum number of lesson plans: a short portfolio gets a notice instead
// (`limited`). This question only covers revisions and reflections.
function requirementsQuestion({ ind }, counts) {
  if (!ind['4.1'] && !ind['4.2']) return [];
  const items = [];
  if (ind['4.1'] && counts.lessonPlans > 0 && counts.revisions < counts.lessonPlans) {
    items.push({
      key: 'revisions',
      label: `גרסאות מתוקנות: נמצאו ל-${counts.revisions} מתוך ${counts.lessonPlans} מערכי השיעור`,
      options: [
        { value: 'outside',       label: 'הוגשו תיקונים נוספים מחוץ למערכת' },
        { value: 'not_submitted', label: 'לא הוגשו תיקונים נוספים' },
      ],
    });
  }
  if (ind['4.2'] && (counts.reflections === 0 || counts.reflections < counts.observations)) {
    items.push({
      key: 'reflections',
      label: counts.observations > 0
        ? `רפלקציות אחרי שיחות משוב: נמצאו ${counts.reflections} מתוך ${counts.observations} תצפיות`
        : 'רפלקציות אחרי שיחות משוב: לא נמצאו בתיק',
      options: [
        { value: 'outside',       label: 'הוגשו רפלקציות נוספות מחוץ למערכת' },
        { value: 'not_submitted', label: 'לא הוגשו רפלקציות נוספות' },
      ],
    });
  }
  if (items.length === 0) return [];
  const codes = ['4.1', '4.2'].filter(c => ind[c]);
  return [{
    id: 'requirements', kind: 'requirements', codes, weight: ind[codes[0]].weight, sortKey: 0,
    topic: 'דרישות הקורס',
    context: null,
    question: 'חלק מדרישות הקורס לא נמצאו בתיק. סמן/י מה התקיים:',
    hint: 'אפשר גם להעלות את המסמכים החסרים במסך הסטודנט/ית ולהריץ את הניתוח מחדש.',
    options: null,
    items,
    note: { placeholder: 'הערה (רשות)' },
  }];
}

function contentQuestion({ ind }, scan) {
  if (!ind['1.1']) return [];
  const errors = (scan?.contentErrors || []).filter(e => e && (e.source || e.example));
  if (errors.length === 0) return [];
  const [first, ...rest] = errors;
  const where = first.source ? `במסמך "${first.source}"` : 'בתיק';
  return [{
    id: 'content_1.1', kind: 'content', codes: ['1.1'], weight: ind['1.1'].weight, sortKey: 0,
    topic: `אי-דיוקים בתוכן · ${ind['1.1'].name}`,
    context: errors.length > 1
      ? errors.map(e => `• ${e.source || 'מסמך'}: ${e.example || ''}`).join('\n')
      : null,
    question: `${where} זוהו אי-דיוקים בתוכן${first.example ? ` (${first.example})` : ''}${rest.length ? `, ועוד ${rest.length === 1 ? 'מקרה אחד' : `${rest.length} מקרים`}` : ''}. זו טעות נקודתית או דפוס?`,
    options: [
      { value: 'one_off', label: 'טעות נקודתית שתוקנה' },
      { value: 'pattern', label: 'חוזר בכמה שיעורים' },
      { value: 'unsure',  label: 'לא בטוח/ה, צריך תצפית נוספת' },
    ],
    note: { placeholder: 'פרט/י (רשות)' },
  }];
}

// ─── Selection and order ─────────────────────────────────────────────────────
function selectQuestions(fixed, conditional) {
  const sorted = [...conditional].sort((a, b) =>
    (b.weight - a.weight) || (KIND_RANK[a.kind] - KIND_RANK[b.kind]) || (a.sortKey - b.sortKey) || a.id.localeCompare(b.id)
  );
  const perKind = {};
  const capped = sorted.filter(q => (perKind[q.kind] = (perKind[q.kind] || 0) + 1) <= KIND_CAP[q.kind]);

  const mandatory = fixed.filter(q => q.mandatory);
  const chosen = capped.slice(0, Math.max(0, MAX_QUESTIONS - mandatory.length));
  let room = MAX_QUESTIONS - chosen.length - mandatory.length;
  const fixedChosen = fixed.filter(q => q.mandatory || (room > 0 && room-- > 0));
  return [...chosen, ...fixedChosen.sort((a, b) => a.order - b.order)]
    .map(({ weight, sortKey, order, ...q }) => q);
}

function buildQuestions({ student, rubric, scan, counts }) {
  const isMale = (student.gender || 'female') === 'male';
  const ctx = { name: student.name, v: (m, f) => (isMale ? m : f), ind: indicatorIndex(rubric) };
  const conditional = [
    ...gapQuestions(ctx, scan),
    ...evidenceQuestions(ctx, scan),
    ...requirementsQuestion(ctx, counts),
    ...contentQuestion(ctx, scan),
  ];
  return selectQuestions(fixedQuestions(ctx), conditional);
}

// ─── Answers → analysis prompt ───────────────────────────────────────────────
// The client sends each question back with its answer, so the model sees what
// was asked and not only the chosen label.
const clip = (s, n = 1500) => (typeof s === 'string' ? s.trim().slice(0, n) : '');

function sanitizeAnswers(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 12).filter(a => a && typeof a === 'object').map(a => ({
    id: clip(a.id, 60),
    kind: clip(a.kind, 20),
    codes: Array.isArray(a.codes) ? a.codes.map(c => clip(String(c), 10)).filter(Boolean).slice(0, 4) : [],
    topic: clip(a.topic, 200),
    question: clip(a.question, 600),
    context: clip(a.context, 800),
    skipped: !!a.skipped,
    value: clip(a.value, 40),
    answer: clip(a.answer, 300),
    note: clip(a.note),
    items: Array.isArray(a.items)
      ? a.items.slice(0, 6).map(i => ({ label: clip(i?.label, 200), answer: clip(i?.answer, 200) })).filter(i => i.label && i.answer)
      : [],
    indicator: a.indicator && typeof a.indicator === 'object'
      ? { id: clip(String(a.indicator.id), 10), name: clip(a.indicator.name, 200) }
      : null,
  }));
}

const RULES = {
  gap: `- הסבר המדריך/ה לפער בין תכנון לביצוע גובר על כלל השקלול הכללי באותו תת-מדד:
  • "השיעור שנצפה לא היה מייצג" — אל תסתמך על התצפית ההיא; קבע לפי התכנון ושאר העדויות.
  • "קושי אמיתי ביישום, שחוזר גם בשיעורים אחרים" — קבע לפי הביצוע בכיתה.
  • "הפער הצטמצם בתצפיות / במערכים מאוחרים יותר" — קבע לפי העדויות המאוחרות.
  • "הכתיבה לא משקפת את היכולת בכיתה" — קבע לפי הביצוע בכיתה, וציין כיעד את חיזוק כתיבת המערכים.`,
  evidence: `- תשובות על עדויות חסרות: "כן" עם תיאור — עדות של המדריך/ה מהשטח, שקול אותה כעדות לכל דבר; "לא, למרות שהייתה הזדמנות" — עדות לקושי בתת-המדד; "לא הייתה הזדמנות לראות" — אין עדות נוספת, אל תסיק רמה מעבר לעדויות שבתיק.`,
  requirements: `- דרישות הקורס: "הוגש מחוץ למערכת" נחשב כהוגש; "לא הוגש" — שקף זאת בתתי-המדדים 4.1 / 4.2.`,
  content: `- אי-דיוקים בתוכן (1.1): "טעות נקודתית שתוקנה" — אל תוריד רמה בגללה; "חוזר בכמה שיעורים" — שקף זאת ב-1.1; "לא בטוח/ה" — ציין זאת כנקודה לבדיקה בתצפית נוספת.`,
  fixed_feedback: `- התשובה על שיפור לאור משוב היא העדות המרכזית לתת-מדד 3.4.`,
  fixed_conduct: `- התנהלות מקצועית (4.3) היא גם תנאי סף: אם דווחו היעדרויות, איחורים או קושי בתקשורת — שקף זאת ב-4.3 וציין זאת בסיכום.`,
  fixed_mentor: `- עמדת המורה המאמנ/ת היא עדות נוספת להצלבה; אם היא שונה מהתמונה שעולה מהתיק, ציין זאת בסיכום.`,
  fixed_strength: `- את נקודת החוזק שציין/ה המדריך/ה כלול ראשונה ב-strengths.`,
};

function formatAnswer(a) {
  const code = a.codes.length ? `[${a.codes.join(', ')}] ` : '';
  const lines = [`- ${code}${a.topic}`, `  שאלה: ${a.question}`];
  if (a.context) lines.push(`  מה המערכת זיהתה: ${a.context.replace(/\n/g, ' ')}`);
  if (a.answer) lines.push(`  תשובה: ${a.answer}`);
  for (const i of a.items) lines.push(`  ${i.label} — ${i.answer}`);
  if (a.indicator) lines.push(`  תת-מדד: ${a.indicator.id} ${a.indicator.name}`);
  if (a.note) lines.push(`  ${a.kind === 'fixed' && !a.answer ? 'תשובה' : 'פירוט'}: ${a.note}`);
  return lines.join('\n');
}

function answersPromptSection({ answers, planVsExecution, hasCriterion3, counts }) {
  const answered = answers.filter(a => !a.skipped);
  const parts = [];

  if (answered.length > 0) {
    parts.push('## השלמות מהמדריך/ה הפדגוגי/ת (נאספו לפני הניתוח)\n' + answered.map(formatAnswer).join('\n'));
  }

  const rules = [];
  if (hasCriterion3) {
    rules.push(`- שקלול תכנון מול ביצוע בקריטריון 3 (הגדרת המדריך/ה): ${PLAN_VS_EXECUTION[planVsExecution] || PLAN_VS_EXECUTION.balanced}. כשיש פער בין המערך הכתוב לשיעור בכיתה בתת-מדד של קריטריון 3, קבע את הרמה לפי הכלל הזה.`);
  }
  const seen = new Set();
  for (const a of answered) {
    const key = a.kind === 'fixed' ? a.id : a.kind;
    if (RULES[key] && !seen.has(key)) { seen.add(key); rules.push(RULES[key]); }
  }
  if (counts && counts.lessonPlans < LIMITED_LESSON_PLANS) {
    rules.push(`- בתיק ${counts.lessonPlans} מערכי שיעור בלבד: ציין בסיכום שההערכה מבוססת על מספר מצומצם של מערכים, ולכן רוחב התמונה מוגבל.`);
  }
  if (rules.length > 0) parts.push('## כללים לשילוב ההשלמות\n' + rules.join('\n'));

  return parts.length ? '\n' + parts.join('\n\n') + '\n' : '';
}

// Indicators whose "not enough evidence" question was skipped.
function insufficientEvidenceCodes(answers) {
  return answers.filter(a => a.kind === 'evidence' && a.skipped).flatMap(a => a.codes);
}

function markInsufficientEvidence(draft, codes) {
  if (!codes.length || !Array.isArray(draft?.categories)) return draft;
  const set = new Set(codes);
  return {
    ...draft,
    categories: draft.categories.map(c => (Array.isArray(c.indicators) ? {
      ...c,
      indicators: c.indicators.map(ind => (set.has(String(ind.id)) ? { ...ind, level: null, note: 'אין מספיק עדויות' } : ind)),
    } : c)),
  };
}

module.exports = {
  MAX_QUESTIONS,
  LIMITED_LESSON_PLANS,
  PLAN_VS_EXECUTION,
  indicatorIndex,
  portfolioCounts,
  buildQuestions,
  sanitizeAnswers,
  answersPromptSection,
  insufficientEvidenceCodes,
  markInsufficientEvidence,
};
