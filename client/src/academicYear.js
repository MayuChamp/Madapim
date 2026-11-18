// Academic years are stored as the Hebrew year number: 5786 = תשפ״ו, 5787 = תשפ״ז.
// A year runs August–July. Mirrors services/academicYear.js on the server.

const START_MONTH = 7; // August (0-based)

export function currentAcademicYear(date = new Date()) {
  return date.getFullYear() + 3761 - (date.getMonth() < START_MONTH ? 1 : 0);
}

const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUNDREDS = ['', 'ק', 'ר', 'ש'];

// 5787 → תשפ״ז
export function hebrewYearLabel(year) {
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

// Years to offer when choosing: next year, this year, last year, plus any in use.
export function yearOptions(used = []) {
  const now = currentAcademicYear();
  return [...new Set([now + 1, now, now - 1, ...used.filter(Number.isInteger)])].sort((a, b) => b - a);
}
