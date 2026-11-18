// ─── Academic years ──────────────────────────────────────────────────────────
// Stored as the Hebrew year number: 5786 = תשפ"ו, 5787 = תשפ"ז. A year runs
// August–July, so August 2026 – July 2027 is 5787. Mirrors client/src/academicYear.js.

const START_MONTH = 7; // August (0-based)

function academicYearOf(date = new Date()) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return academicYearOf(new Date());
  return d.getFullYear() + 3761 - (d.getMonth() < START_MONTH ? 1 : 0);
}

function isValidAcademicYear(n) {
  return Number.isInteger(n) && n >= 5770 && n <= 5820;
}

const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUNDREDS = ['', 'ק', 'ר', 'ש'];

// 5787 → תשפ״ז
function hebrewYearLabel(year) {
  let n = year % 1000;
  let s = '';
  while (n >= 400) { s += 'ת'; n -= 400; }
  s += HUNDREDS[Math.floor(n / 100)];
  n %= 100;
  if (n === 15) s += 'טו';
  else if (n === 16) s += 'טז';
  else s += TENS[Math.floor(n / 10)] + ONES[n % 10];
  return s.length > 1 ? `${s.slice(0, -1)}״${s.slice(-1)}` : `${s}׳`;
}

// CSV cell → year number, or null. Accepts 5787, תשפ"ז, תשפ״ז, תשפז.
function parseAcademicYear(raw) {
  const v = String(raw || '').trim();
  if (!v) return null;
  if (/^\d{4}$/.test(v)) return isValidAcademicYear(Number(v)) ? Number(v) : null;
  const letters = v.replace(/["'״׳\s]/g, '');
  for (let y = 5770; y <= 5820; y++) {
    if (hebrewYearLabel(y).replace(/[״׳]/g, '') === letters) return y;
  }
  return null;
}

module.exports = { academicYearOf, isValidAcademicYear, hebrewYearLabel, parseAcademicYear };
