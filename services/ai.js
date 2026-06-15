const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = 'gemini-2.5-flash';

// ─── Rubric definition (כלי מדפים, 6 criteria) ───────────────────────────────
const RUBRIC = [
  { id: 'c1', name: 'שליטה בתחום הדעת',        weight: 15, channels: ['lesson_plan'],                desc: 'ידע נדרש מספק; למידה מתמדת של היסטוריה כהכנה להוראה' },
  { id: 'c2', name: 'תפיסה מקצועית',            weight: 15, channels: ['lesson_plan'],                desc: 'הסבר מטרות ההוראה; קווים מנחים לניהול הכיתה' },
  { id: 'c3', name: 'שליטה במיומנויות הוראה',  weight: 30, channels: ['lesson_plan', 'observation'], desc: 'בניית שיעור: שאלת מוקד, פעולת דריכה, מקורות, ביצועי הבנה, ניהול דיון; שיפור לאור משוב' },
  { id: 'c4', name: 'עמידה בדרישות הקורס',     weight: 20, channels: [],                             desc: 'לפחות 5 מערכי שיעור עם תיקונים; רפלקציה לאחר שיחת משוב' },
  { id: 'c5', name: 'תקשורת עם תלמידים',        weight: 10, channels: ['observation'],                desc: 'יחס מכבד וקשוב; זיהוי צרכים שונים; מעורבות ואחריות (מתצפית בלבד)' },
  { id: 'c6', name: 'משוב',                      weight: 10, channels: ['observation'],                desc: 'פתיחות למשוב; התבוננות עצמית כנה; הסקת מסקנות (מתצפית בלבד)' },
];

const LEVELS = ['גבוהה', 'בינונית-גבוהה', 'בינונית', 'בינונית-נמוכה'];

// ─── Helper: call Gemini and return text ─────────────────────────────────────
async function callGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

// ─── Build document context from uploaded files ───────────────────────────────
function buildDocContext(files) {
  if (!files || files.length === 0) return 'לא הועלו מסמכים עדיין.';
  return files
    .filter(f => f.parsed_text && f.parsed_text.length > 20)
    .map((f, i) => {
      const label = f.track_type === 'lesson_plan' ? '📘 מערך שיעור' : '🎯 תצפית/רפלקציה';
      return `--- מסמך ${i + 1}: ${label} | ${f.original_name} ---\n${f.parsed_text.slice(0, 3000)}\n`;
    })
    .join('\n');
}

// ─── Main analysis ────────────────────────────────────────────────────────────
async function analyzePortfolio(studentName, files, instructorAnswers = {}, gender = 'female') {
  const docContext = buildDocContext(files);
  const isMale = gender === 'male';
  const studentTitle = isMale ? 'הסטודנט' : 'הסטודנטית';
  const pronoun = isMale ? 'הוא' : 'היא';
  const possessive = isMale ? 'שלו' : 'שלה';

  const answersText = Object.keys(instructorAnswers).length > 0
    ? '\n## תובנות המדריך הפדגוגי\n' +
      Object.entries(instructorAnswers).map(([, val]) => {
        const answer = typeof val === 'object'
          ? `${val.label || ''}${val.note ? ' — ' + val.note : ''}`
          : val;
        return `- ${answer}`;
      }).join('\n')
    : '';

  const rubricText = RUBRIC.map((c, i) =>
    `${i + 1}. ${c.name} (${c.weight}%) — ערוצים: ${c.channels.join(', ') || 'קלט מדריך בלבד'}`
  ).join('\n');

  const prompt = `אתה מערכת הערכה פדגוגית לסטודנטים מורים. נתח את תיק ההתנסות של ${studentTitle} והפק טיוטת הערכה מקצועית בעברית.
השתמש בלשון ${isMale ? 'זכר' : 'נקבה'} בכל הניסוח (${pronoun}, ${possessive} וכו׳).

## שם ${studentTitle}
${studentName}

## מחוון ההערכה (מחוון כלי מדפים)
${rubricText}
${answersText}

## חומרי התיק שהועלו
${docContext}

## הוראות
עבור כל קריטריון במחוון ספק:
1. רמה למערך שיעור (📘): אחד מהקודים האנגליים הבאים בדיוק: high / mid_high / mid / low_mid — או null אם אין מסמכים רלוונטיים
2. רמה לצפייה (🎯): אחד מהקודים האנגליים הבאים בדיוק: high / mid_high / mid / low_mid — או null
3. רמה כוללת: אחד מהקודים האנגליים הבאים בדיוק: high / mid_high / mid / low_mid
4. פסקת איזון: 2–3 משפטים המשלבים את שני הערוצים על בסיס הראיות
5. האם יש פער בין הערוצים (hasGap): true/false
6. סיכום הפער אם קיים: משפט אחד

קריטריון c7 מבוסס על קלט המדריך בלבד; אם לא ניתן קלט ציין "טעון השלמה".

החזר JSON גולמי בלבד (ללא markdown, ללא הסברים):
{
  "studentName": "${studentName}",
  "score": <מספר 60-100>,
  "overallLevel": "<high|mid_high|mid|low_mid>",
  "summary": "<פסקת סיכום והמלצות>",
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

  const raw = await callGemini(prompt);
  const jsonStr = raw
    .replace(/^```(?:json)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    console.error('Gemini non-JSON response:\n', raw.slice(0, 600));
    throw new Error('תגובת ה-AI לא הייתה ב-JSON תקין — בדוק את מפתח ה-API');
  }

  return parsed;
}

// ─── Smart gap questions ──────────────────────────────────────────────────────
async function generateSmartQuestions(analysisResult, studentName, gender = 'female') {
  const gaps    = (analysisResult.categories || []).filter(c => c.hasGap);
  const missing = (analysisResult.categories || []).filter(
    c => !c.overallLevel || (!c.lessonPlanLevel && !c.observationLevel)
  );

  if (gaps.length === 0 && missing.length === 0) return [];

  const isMale = gender === 'male';
  const studentTitle = isMale ? 'הסטודנט' : 'הסטודנטית';

  const prompt = `בהתבסס על ניתוח התיק של ${studentTitle} ${studentName} זוהו:
${gaps.map(c => `- פער ב${c.name}: ${c.gapSummary || ''}`).join('\n')}
${missing.map(c => `- חסר תיעוד: ${c.name}`).join('\n')}

צור עד 3 שאלות ממוקדות למדריך הפדגוגי.
- פערים בין מערך לצפייה → type: "decision" עם 3 options
- חומרים חסרים → type: "text"

החזר JSON גולמי בלבד:
[{"id":"q1","type":"decision|text","badge":"...","context":"...","question":"...","options":[{"value":"...","label":"...","detail":"..."}],"placeholder":"..."}]
(options רלוונטי ל-decision בלבד. מערך ריק [] אם אין שאלות.)`;

  try {
    const raw = await callGemini(prompt);
    const jsonStr = raw
      .replace(/^```(?:json)?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();
    return JSON.parse(jsonStr);
  } catch {
    return [];
  }
}

module.exports = { analyzePortfolio, generateSmartQuestions, RUBRIC };
