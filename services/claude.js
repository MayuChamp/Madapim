const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Rubric definition (כלי מדפים, 6 criteria) ──────────────────────────────
const RUBRIC = [
  { id: 'c1', name: 'שליטה בתחום הדעת',        weight: 15, channels: ['lesson_plan'],                desc: 'ידע נדרש מספק; למידה מתמדת של היסטוריה כהכנה להוראה' },
  { id: 'c2', name: 'תפיסה מקצועית',            weight: 15, channels: ['lesson_plan'],                desc: 'הסבר מטרות ההוראה; קווים מנחים לניהול הכיתה' },
  { id: 'c3', name: 'שליטה במיומנויות הוראה',  weight: 30, channels: ['lesson_plan', 'observation'], desc: 'בניית שיעור: שאלת מוקד, פעולת דריכה, מקורות, ביצועי הבנה, ניהול דיון; שיפור לאור משוב' },
  { id: 'c4', name: 'עמידה בדרישות הקורס',     weight: 20, channels: [],                             desc: 'לפחות 5 מערכי שיעור עם תיקונים; רפלקציה לאחר שיחת משוב' },
  { id: 'c5', name: 'תקשורת עם תלמידים',        weight: 10, channels: ['observation'],                desc: 'יחס מכבד וקשוב; זיהוי צרכים שונים; מעורבות ואחריות (מתצפית בלבד)' },
  { id: 'c6', name: 'משוב',                      weight: 10, channels: ['observation'],                desc: 'פתיחות למשוב; התבוננות עצמית כנה; הסקת מסקנות (מתצפית בלבד)' },
];

const LEVELS = ['גבוהה', 'בינונית-גבוהה', 'בינונית', 'בינונית-נמוכה'];

// ─── Build document context from files ──────────────────────────────────────
function buildDocContext(files) {
  if (!files || files.length === 0) {
    return 'לא הועלו מסמכים עדיין.';
  }
  return files
    .filter(f => f.parsed_text && f.parsed_text.length > 20)
    .map((f, i) => {
      const trackLabel = f.track_type === 'lesson_plan' ? '📘 מערך שיעור' : '🎯 תצפית/רפלקציה';
      return `--- מסמך ${i + 1}: ${trackLabel} | ${f.original_name} ---\n${f.parsed_text.slice(0, 3000)}\n`;
    })
    .join('\n');
}

// ─── Build prompt ────────────────────────────────────────────────────────────
function buildPrompt(studentName, files, instructorAnswers = {}, gender = 'female') {
  const docContext = buildDocContext(files);

  const answersText = Object.keys(instructorAnswers).length > 0
    ? '\n## תובנות המדריך הפדגוגי\n' +
      Object.entries(instructorAnswers).map(([qId, val]) => {
        const answer = typeof val === 'object' ? `${val.label || ''}${val.note ? ' — ' + val.note : ''}` : val;
        return `- ${answer}`;
      }).join('\n')
    : '';

  const rubricText = RUBRIC.map((c, i) =>
    `${i + 1}. ${c.name} (${c.weight}%) — ערוצים: ${c.channels.join(', ') || 'קלט מדריך בלבד'}`
  ).join('\n');

  const isMale = gender === 'male';
  const studentTitle = isMale ? 'הסטודנט' : 'הסטודנטית';
  const pronoun = isMale ? 'הוא' : 'היא';
  const possessive = isMale ? 'שלו' : 'שלה';

  return `אתה מערכת הערכה פדגוגית לסטודנטים מורים. עליך לנתח את תיק ההתנסות של ${studentTitle} ולהפיק טיוטת הערכה מקצועית בעברית.
השתמש בלשון ${isMale ? 'זכר' : 'נקבה'} בכל הניסוח (${pronoun}, ${possessive} וכו׳).

## שם ${studentTitle}
${studentName}

## מחוון ההערכה (מחוון כלי מדפים)
${rubricText}
${answersText}

## חומרי התיק שהועלו
${docContext}

## הוראות
עבור כל קריטריון במחוון, ספק:
1. רמה למערך שיעור (📘): אחת מ: ${LEVELS.join(' / ')} — או "אין ראיה" אם אין מסמכים רלוונטיים
2. רמה לצפייה (🎯): אחת מ: ${LEVELS.join(' / ')} — או "אין ראיה"
3. רמה כוללת: אחד מ: high / mid_high / mid / low_mid
4. פסקת איזון: 2–3 משפטים המשלבים את שני הערוצים, מבוסס על הראיות
5. האם יש פער בין הערוצים (gap): true/false
6. סיכום הפער אם קיים: משפט אחד

קריטריון c7 (חובות מערכת) — מבוסס על קלט המדריך בלבד. אם לא ניתן קלט, ציין "טעון השלמה".

החזר JSON בדיוק בפורמט הזה (ללא markdown, JSON גולמי בלבד):
{
  "studentName": "${studentName}",
  "score": <מספר 60-100>,
  "overallLevel": "<high|mid_high|mid|low_mid>",
  "summary": "<פסקת סיכום והמלצות בעברית>",
  "categories": [
    {
      "id": "c1",
      "name": "...",
      "weight": 15,
      "overallLevel": "<high|mid_high|mid|low_mid>",
      "lessonPlanLevel": "<high|mid_high|mid|low_mid|null>",
      "lessonPlanNote": "...",
      "observationLevel": "<high|mid_high|mid|low_mid|null>",
      "observationNote": "...",
      "balance": "<פסקת איזון>",
      "hasGap": <true|false>,
      "gapSummary": "..."
    }
  ]
}`;
}

// ─── Main analysis function ──────────────────────────────────────────────────
async function analyzePortfolio(studentName, files, instructorAnswers = {}, gender = 'female') {
  const prompt = buildPrompt(studentName, files, instructorAnswers, gender);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim();

  // Strip markdown code fences if Claude wrapped the JSON
  const jsonStr = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    console.error('Claude returned non-JSON, raw output:', raw.slice(0, 500));
    throw new Error('תגובת ה-AI לא הייתה ב-JSON תקין');
  }

  return parsed;
}

// ─── Smart gap questions (generated after analysis) ─────────────────────────
async function generateSmartQuestions(analysisResult, studentName, gender = 'female') {
  const gaps = (analysisResult.categories || []).filter(c => c.hasGap);
  const missing = (analysisResult.categories || []).filter(
    c => c.overallLevel === null || c.observationLevel === null
  );

  if (gaps.length === 0 && missing.length === 0) return [];

  const studentTitle = gender === 'male' ? 'הסטודנט' : 'הסטודנטית';

  const prompt = `בהתבסס על ניתוח התיק של ${studentTitle} ${studentName}, זוהו הפערים הבאים:
${gaps.map(c => `- ${c.name}: ${c.gapSummary}`).join('\n')}
${missing.map(c => `- ${c.name}: חסר תיעוד`).join('\n')}

צור עד 3 שאלות ממוקדות שעל המדריך הפדגוגי לענות עליהן כדי להשלים את ההערכה.
עבור כל פער בין מערך לצפייה — שאלת החלטה (decision).
עבור חומרים חסרים — שאלת טקסט פתוח (text).

החזר JSON בלבד:
[
  {
    "id": "q1",
    "type": "decision|text",
    "badge": "תיאור קצר",
    "context": "מה זיהתה המערכת",
    "question": "השאלה למדריך",
    "options": [{"value":"...","label":"...","detail":"..."}],
    "placeholder": "..."
  }
]
(options רלוונטי רק ל-decision. להחזיר מערך ריק [] אם אין שאלות.)`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim()
    .replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

module.exports = { analyzePortfolio, generateSmartQuestions, RUBRIC };
