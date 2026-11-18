const heFull = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' });
const heMonth = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long' });
const enParts = new Intl.DateTimeFormat('en-u-ca-hebrew-nu-latn', { day: 'numeric', year: 'numeric' });

export function gregorianToHebrew(d) {
  return heFull.format(d);
}

export function hebrewYearOf(d) {
  return Number(enParts.formatToParts(d).find((p) => p.type === 'year').value);
}

const yearCache = new Map();

// סורקים ימים גרגוריאניים מ-1 בספטמבר ושומרים את מיקום כל תאריך עברי בשנה.
function scanYear(year) {
  if (yearCache.has(year)) return yearCache.get(year);
  const months = [];
  const dates = new Map();
  const start = new Date(year - 3761, 8, 1, 12);
  for (let i = 0; i < 420; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12);
    const parts = Object.fromEntries(enParts.formatToParts(d).filter((p) => p.type === 'day' || p.type === 'year').map((p) => [p.type, Number(p.value)]));
    if (parts.year !== year) continue;
    const month = heMonth.format(d);
    if (!months.includes(month)) months.push(month);
    dates.set(`${month}|${parts.day}`, d);
  }
  const scanned = { months: months.map((key) => ({ key, label: key })), dates };
  yearCache.set(year, scanned);
  return scanned;
}

export function hebrewMonthsOfYear(year) {
  return scanYear(year).months;
}

export function hebrewToGregorian(year, monthKey, day) {
  const d = scanYear(year).dates.get(`${monthKey}|${day}`);
  return d ? new Date(d) : null;
}

export function daysBetween(a, b) {
  const utc = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((utc(b) - utc(a)) / 86400000);
}
