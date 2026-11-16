const Anthropic = require('@anthropic-ai/sdk');
const { PERFORMANCE_LEVELS, EVALUATION_PROTOCOL, levelFromScore, weightedScore } = require('../rubrics/mainRubric');

const MODEL = 'claude-opus-5-5';

const LEVELS = ['גבוהה', 'בינונית-גבוהה', 'בינונית', 'בינונית-נמוכה'];

// Created on first use so the server still starts when the key is missing.
let client;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

// ─── Helper: call Claude and return text ─────────────────────────────────────
// Streams (long Hebrew portfolios can produce long JSON drafts) and returns only
// the text blocks. If the model declines, the API retries on a fallback model.
async function callClaude(prompt, { effort = 'high', system, maxTokens = 64000 } = {}) {
  const messages = Array.isArray(prompt) ? prompt : [{ role: 'user', content: prompt }];
  let message;
  try {
    message = await getClient().beta.messages.stream({
      model: MODEL,
      max_tokens: maxTokens,
      output_config: { effort },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      ...(system ? { system } : {}),
      messages,
    }).finalMessage();
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error('מפתח ה-API של Claude אינו תקין — בדוק את ANTHROPIC_API_KEY');
    }
    throw err;
  }

  if (message.stop_reason === 'refusal') {
    throw new Error('ה-AI סירב לנתח את החומרים — נסה שוב או בדוק את תוכן הקבצים');
  }
  if (message.stop_reason === 'max_tokens') {
    throw new Error('תגובת ה-AI נקטעה לפני הסוף — נסה שוב');
  }

  return message.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim();
}

// ─── Helper: parse a JSON object/array out of the model's text ───────────────
function parseJson(raw, open, close) {
  const stripped = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {
    // Fall back to the outermost {...} / [...] in case of stray prose around it.
    const start = stripped.indexOf(open);
    const end = stripped.lastIndexOf(close);
    if (start === -1 || end <= start) throw new SyntaxError('No JSON found');
    return JSON.parse(stripped.slice(start, end + 1));
  }
}

// ─── Build document context from uploaded files ───────────────────────────────
// `track_type` and `cycle_topic` come from the file's cycle (q.studentFiles).
const STAGE_LABELS = {
  lesson_plan: { submission: 'מערך שיעור', instructorNotes: 'הערות המדריך/ה למערך', revision: 'מערך שיעור · גרסה מתוקנת' },
  observation: { observation: 'תצפית', feedback: 'משוב על התצפית', reflection: 'רפלקציה אחרי שיחת משוב' },
};

function docLabel(f) {
  if (f.track_type === 'lesson_plan') return `📘 ${STAGE_LABELS.lesson_plan[f.stage_key] || 'מערך שיעור'}`;
  if (f.track_type === 'observation') return `🎯 ${STAGE_LABELS.observation[f.stage_key] || 'תצפית'}`;
  return '📎 חומר נוסף';
}

function buildDocContext(files) {
  const docs = (files || []).filter(f => f.parsed_text && f.parsed_text.length > 20);
  if (docs.length === 0) return 'לא הועלו מסמכים עדיין.';
  return docs
    .map((f, i) => {
      const where = f.cycle_topic ? ` | ${f.cycle_topic}` : '';
      const desc = f.description ? ` | ${f.description}` : '';
      return `--- מסמך ${i + 1}: ${docLabel(f)}${where} | ${f.original_name}${desc} ---\n${f.parsed_text.slice(0, 3000)}\n`;
    })
    .join('\n');
}

// ─── Pre-scan (before the "השלמת מידע" questions) ─────────────────────────────
// A short pass over the portfolio that only gathers what services/questions.js
// needs to decide which questions to ask. It writes no evaluation.
const VALID_SCAN_LEVELS = new Set(['high', 'mid_high', 'mid', 'low_mid']);

async function prescanPortfolio(student, files, rubric) {
  const indicators = (rubric?.criteria || []).flatMap(c =>
    (c.indicators || []).map(ind => ({ ...ind, id: String(ind.id), criterionName: c.name }))
  );
  const empty = { indicators: [], contentErrors: [], revisedLessonPlans: 0, reflections: 0 };
  if (indicators.length === 0) return empty;

  const hasDocs = (files || []).some(f => f.parsed_text && f.parsed_text.length > 20);
  if (!hasDocs) {
    return { ...empty, indicators: indicators.map(i => ({ id: i.id, evidenceCount: 0, lookFor: null })) };
  }

  const isMale = (student.gender || 'female') === 'male';
  const studentTitle = isMale ? 'הסטודנט' : 'הסטודנטית';
  const c3Codes = indicators.filter(i => i.id.startsWith('3.')).map(i => i.id);
  const indicatorList = indicators.map(i =>
    `- ${i.id} — ${i.name} (${i.criterionName})${i.levels?.mid_high ? `\n  ברמה "טוב / שולט": ${i.levels.mid_high}` : ''}`
  ).join('\n');

  const prompt = `סרוק את תיק ההתנסות של ${studentTitle} ${student.name} והחזר נתונים שיעזרו להחליט אילו שאלות לשאול את המדריך/ה הפדגוגי/ת לפני ההערכה. אל תכתוב הערכה.

## תתי-המדדים במחוון
${indicatorList}

## חומרי התיק
${buildDocContext(files)}

## מה להחזיר
1. indicators — לכל תת-מדד ברשימה:
   - id
   - evidenceCount: כמה עדויות נפרדות יש בחומרים לתת-המדד (מסמכים או אירועים שונים; 0 אם אין)
   - lookFor: רק אם evidenceCount קטן מ-2 — התנהגות נצפית קצרה (עד 12 מילים) מתוך תיאור הרמה "טוב / שולט", בלשון ${isMale ? 'זכר' : 'נקבה'} בזמן הווה, שמשלימה את המשפט "האם ראית את ${student.name} ..." (למשל: "${isMale ? 'מתאים' : 'מתאימה'} מענה לתלמיד או לקבוצה מסוימים"). אחרת null.
   - planLevel / executionLevel: ${c3Codes.length ? `רק לתתי-המדדים ${c3Codes.join(', ')} — הרמה לפי מערכי השיעור (📘) והרמה לפי התצפיות (🎯), כל אחת בנפרד: high / mid_high / mid / low_mid, או null אם אין עדות באותו ערוץ. לשאר תתי-המדדים null.` : 'null לכל תתי-המדדים.'}
   - planSource / executionSource: שם הקובץ העיקרי שעליו מבוססת כל אחת מהרמות, או null.
2. contentErrors — טעויות ברורות בתוכן הדיסציפלינרי (לא ניסוח או סגנון) במערכים או בתצפיות: [{"source": "<שם הקובץ>", "example": "<תיאור קצר של הטעות, עד 12 מילים>"}]. מערך ריק אם אין.
3. revisedLessonPlans — לכמה מערכי שיעור יש בחומרים גרסה מתוקנת.
4. reflections — כמה רפלקציות של ${studentTitle} אחרי שיחות משוב יש בחומרים.

החזר JSON גולמי בלבד (ללא markdown):
{"indicators":[{"id":"1.1","evidenceCount":0,"lookFor":null,"planLevel":null,"executionLevel":null,"planSource":null,"executionSource":null}],"contentErrors":[],"revisedLessonPlans":0,"reflections":0}`;

  const raw = await callClaude(prompt, { effort: 'medium', maxTokens: 8000 });
  const parsed = parseJson(raw, '{', '}');

  const known = new Set(indicators.map(i => i.id));
  const level = v => (VALID_SCAN_LEVELS.has(v) ? v : null);
  const text = (v, n) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null);
  return {
    indicators: (Array.isArray(parsed.indicators) ? parsed.indicators : [])
      .filter(s => s && known.has(String(s.id)))
      .map(s => ({
        id: String(s.id),
        evidenceCount: Number.isFinite(Number(s.evidenceCount)) ? Number(s.evidenceCount) : null,
        lookFor: text(s.lookFor, 160),
        planLevel: level(s.planLevel),
        executionLevel: level(s.executionLevel),
        planSource: text(s.planSource, 120),
        executionSource: text(s.executionSource, 120),
      })),
    contentErrors: (Array.isArray(parsed.contentErrors) ? parsed.contentErrors : [])
      .filter(e => e && (e.source || e.example))
      .slice(0, 5)
      .map(e => ({ source: text(e.source, 120), example: text(e.example, 160) })),
    revisedLessonPlans: Number(parsed.revisedLessonPlans) || 0,
    reflections: Number(parsed.reflections) || 0,
  };
}

// ─── Main analysis ────────────────────────────────────────────────────────────
// `instructorSection` is the prompt text built from the "השלמת מידע" answers
// (services/questions.js → answersPromptSection).
async function analyzePortfolio({ studentName, files, gender = 'female', rubric, instructorSection = '' }) {
  const criteria = rubric?.criteria || [];
  const docContext = buildDocContext(files);
  const isMale = gender === 'male';
  const studentTitle = isMale ? 'הסטודנט' : 'הסטודנטית';
  const pronoun = isMale ? 'הוא' : 'היא';
  const possessive = isMale ? 'שלו' : 'שלה';

  const hasIndicators = criteria.some(c => Array.isArray(c.indicators) && c.indicators.length > 0);

  const rubricText = criteria.map((c, i) => {
    const channels = Array.isArray(c.channels) && c.channels.length > 0
      ? c.channels.join(', ')
      : 'כל החומרים הרלוונטיים';
    const lines = [`${i + 1}. ${c.id || 'c' + (i + 1)}: ${c.name} (${c.weight}%) — ערוצים: ${channels}${c.desc ? ` — ${c.desc}` : ''}`];
    if (c.evidence) lines.push(`   עדויות מרכזיות: ${c.evidence}`);
    for (const ind of (c.indicators || [])) {
      lines.push(`   מדד ${ind.id} — ${ind.name}:`);
      for (const lvl of PERFORMANCE_LEVELS) {
        if (ind.levels?.[lvl.key]) lines.push(`     • ${lvl.key} = ${lvl.label} (${lvl.range}): ${ind.levels[lvl.key]}`);
      }
    }
    return lines.join('\n');
  }).join('\n');

  const scaleText = PERFORMANCE_LEVELS.map(l => `${l.key} = ${l.label} (${l.range})`).join(' · ');
  const protocolText = hasIndicators
    ? '\n## פרוטוקול הערכה מבוססת עדויות\n' + EVALUATION_PROTOCOL.map(p => `שלב ${p.stage}' – ${p.title}: ${p.text}`).join('\n') + '\n'
    : '';

  const prompt = `אתה מערכת הערכה פדגוגית לסטודנטים מורים. נתח את תיק ההתנסות של ${studentTitle} והפק טיוטת הערכה מקצועית בעברית.
השתמש בלשון ${isMale ? 'זכר' : 'נקבה'} בכל הניסוח (${pronoun}, ${possessive} וכו׳).

## שם ${studentTitle}
${studentName}

## מחוון ההערכה (${rubric?.name || 'מחוון'})
סולם רמות הביצוע: ${scaleText}
${rubricText}
${protocolText}${instructorSection}

## חומרי התיק שהועלו
${docContext}

## הוראות
עבור כל קריטריון במחוון ספק:
1. ציון (score): מספר שלם 0–100, התואם את סולם רמות הביצוע ואת מדדי הקריטריון — או null אם אין שום עדות לקריטריון
2. רמה כוללת: אחד מהקודים האנגליים הבאים בדיוק: high / mid_high / mid / low_mid (חייבת להתאים לטווח הציון)
3. רמה למערך שיעור (📘): high / mid_high / mid / low_mid — או null אם אין מסמכים רלוונטיים
4. רמה לצפייה (🎯): high / mid_high / mid / low_mid — או null
5. פסקת איזון: 2–3 משפטים המשלבים את שני הערוצים, עם הפניה לעדויות ספציפיות (מערכים, תצפיות, רפלקציות)
6. האם יש פער בין הערוצים (hasGap): true/false
7. סיכום הפער אם קיים: משפט אחד${hasIndicators ? `
8. indicators: לכל מדד של הקריטריון (לפי המזהה שלו, למשל "1.1") — רמה (high / mid_high / mid / low_mid, או null אם אין עדות) ומשפט נימוק קצר מבוסס עדויות. בחר את הרמה שתיאורה במחוון תואם ביותר את העדויות.` : ''}

בנוסף ספק ברמת ההערכה כולה:
- strengths: 2–4 חוזקות מרכזיות הבאות לידי ביטוי בעדויות לאורך הסמסטר
- goals: 2–4 יעדים מרכזיים להמשך ההתפתחות המקצועית

אל תחשב ציון סופי — הוא מחושב אוטומטית לפי משקלי הקריטריונים.
קריטריונים ללא ערוצים ("כל החומרים הרלוונטיים" בלבד) מבוססים על קלט המדריך בעיקר; אם לא ניתן קלט ציין "טעון השלמה".

החזר JSON גולמי בלבד (ללא markdown, ללא הסברים):
{
  "studentName": "${studentName}",
  "summary": "<פסקת סיכום והמלצות>",
  "strengths": ["..."],
  "goals": ["..."],
  "categories": [
    {
      "id": "c1",
      "name": "...",
      "weight": 25,
      "score": <0-100|null>,
      "overallLevel": "<high|mid_high|mid|low_mid>",
      "lessonPlanLevel": "<high|mid_high|mid|low_mid|null>",
      "lessonPlanNote": "...",
      "observationLevel": "<high|mid_high|mid|low_mid|null>",
      "observationNote": "...",
      "balance": "<פסקת איזון>",
      "hasGap": <true|false>,
      "gapSummary": "..."${hasIndicators ? `,
      "indicators": [{ "id": "1.1", "level": "<high|mid_high|mid|low_mid|null>", "note": "..." }]` : ''}
    }
  ]
}`;

  const raw = await callClaude(prompt, { effort: 'high' });

  let parsed;
  try {
    parsed = parseJson(raw, '{', '}');
  } catch (err) {
    console.error('Claude non-JSON response:\n', raw.slice(0, 600));
    throw new Error('תגובת ה-AI לא הייתה ב-JSON תקין — נסה שוב');
  }

  return normalizeDraft(parsed, rubric);
}

// ─── Align the AI draft with the rubric and compute the weighted score ────────
// Names, weights and indicator names always come from the rubric, never from the
// model. The level of a scored criterion follows its score band, and the final
// score is Σ(score × weight) / Σ(weight) — for the main rubric:
// C1×0.25 + C2×0.15 + C3×0.30 + C4×0.30.
const VALID_LEVELS = new Set(PERFORMANCE_LEVELS.map(l => l.key));

function normalizeDraft(draft, rubric) {
  const criteria = rubric?.criteria || [];
  const aiCats = Array.isArray(draft.categories) ? draft.categories : [];
  if (criteria.length === 0) return draft;

  const categories = criteria.map((c, i) => {
    const id = c.id || `c${i + 1}`;
    const ai = aiCats.find(x => x && x.id === id) || aiCats[i] || {};
    const rawScore = ai.score === null || ai.score === undefined || ai.score === '' ? NaN : Number(ai.score);
    const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : null;
    const level = v => (VALID_LEVELS.has(v) ? v : null);

    const cat = {
      ...ai,
      id,
      name: c.name,
      weight: c.weight,
      score,
      overallLevel: score !== null ? levelFromScore(score) : level(ai.overallLevel),
      lessonPlanLevel: level(ai.lessonPlanLevel),
      observationLevel: level(ai.observationLevel),
    };

    if (Array.isArray(c.indicators) && c.indicators.length > 0) {
      const aiInds = Array.isArray(ai.indicators) ? ai.indicators : [];
      cat.indicators = c.indicators.map((ind, j) => {
        const a = aiInds.find(x => x && String(x.id) === String(ind.id)) || aiInds[j] || {};
        return { id: ind.id, name: ind.name, level: level(a.level), note: a.note || '' };
      });
    } else {
      delete cat.indicators;
    }
    return cat;
  });

  const score = weightedScore(categories);
  return {
    ...draft,
    rubricId: rubric?.id || null,
    rubricName: rubric?.name || null,
    categories,
    score,
    overallLevel: score !== null ? levelFromScore(score) : (VALID_LEVELS.has(draft.overallLevel) ? draft.overallLevel : null),
    strengths: Array.isArray(draft.strengths) ? draft.strengths.filter(Boolean) : [],
    goals: Array.isArray(draft.goals) ? draft.goals.filter(Boolean) : [],
  };
}

// ─── Portfolio chat ───────────────────────────────────────────────────────────
// Answers the instructor's questions about the student, grounded in the uploaded
// evidence and the current draft. Can also rewrite draft texts on request, in
// which case `updates` carries the new texts for the client to apply.
function buildDraftContext(draft) {
  if (!draft || !Array.isArray(draft.categories) || draft.categories.length === 0) {
    return 'אין עדיין טיוטת הערכה.';
  }
  const cats = draft.categories.map((c, i) => {
    const parts = [`${i + 1}. [${c.id}] ${c.name} (${c.weight}%)`];
    if (c.score !== null && c.score !== undefined && c.score !== '') parts.push(`ציון: ${c.score}`);
    if (c.overallLevel) parts.push(`רמה: ${c.overallLevel}`);
    return `${parts.join(' | ')}\n   ${c.balance || '(ללא טקסט)'}`;
  }).join('\n');
  return `${cats}\n\nסיכום: ${draft.summary || '(ללא סיכום)'}\nציון מסכם: ${draft.score ?? '—'}`;
}

async function chatPortfolio({ student, files, draft, history = [], message }) {
  const isMale = (student.gender || 'female') === 'male';
  const studentTitle = isMale ? 'הסטודנט' : 'הסטודנטית';

  const system = `אתה העוזר החכם של מפAI — מערכת הערכה פדגוגית לסטודנטים להוראה. אתה משוחח עם המדריך/ה הפדגוגי/ת של ${studentTitle} ${student.name}.
השתמש בלשון ${isMale ? 'זכר' : 'נקבה'} כשאתה מתייחס ל${studentTitle}.

## חומרי התיק שהועלו (הראיות)
${buildDocContext(files)}

## טיוטת ההערכה הנוכחית
${buildDraftContext(draft)}

## כללים
- ענה בעברית, בקצרה ולעניין (2–5 משפטים), בטון מקצועי.
- בסס כל טענה על הראיות: ציין באיזה מסמך ראית אותה (שם הקובץ או "מסמך N"). אל תמציא עובדות שאינן בחומרים.
- אם אין בחומרים תשובה לשאלה — אמור זאת במפורש והצע מה כדאי לתעד.
- אם המדריך מבקש לשכתב טקסט בטיוטה (למשל: נסח חיובי יותר, קצר יותר, שנה את הסיכום) — כתוב את הנוסח החדש המלא ב-updates, ושמור על עובדות הטיוטה המקוריות.

החזר תמיד JSON גולמי בלבד (ללא markdown) במבנה:
{"reply": "<התשובה למדריך>", "updates": {"summary": "<סיכום חדש או null>", "categories": [{"id": "c1", "balance": "<נוסח חדש>"}]} או null}
כש-updates הוא null אם לא התבקש שינוי בטיוטה.`;

  const messages = [
    ...history
      .filter(m => m && typeof m.text === 'string' && m.text.trim())
      .slice(-12)
      .map(m => ({ role: m.role === 'assistant' || m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
    { role: 'user', content: message },
  ];

  const raw = await callClaude(messages, { effort: 'low', system, maxTokens: 4096 });

  try {
    const parsed = parseJson(raw, '{', '}');
    if (parsed && typeof parsed.reply === 'string') {
      return { reply: parsed.reply, updates: parsed.updates || null };
    }
  } catch { /* fall through — treat the whole answer as plain text */ }
  return { reply: raw, updates: null };
}

module.exports = { analyzePortfolio, prescanPortfolio, normalizeDraft, chatPortfolio };
