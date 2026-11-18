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

// "עד ל" לפני שם אירוע בלי ה' הידיעה, "עד" לפני שם עם ה' הידיעה או שם בכתב לועזי.
function untilPhrase(label) {
  const name = label.trim();
  if (!name) return 'לאירוע';
  if (!/^[א-ת]/.test(name) || name.startsWith('ה')) return name;
  return `ל${name}`;
}

export function countdownText(label, days) {
  if (!Number.isInteger(days)) return '';
  const name = label.trim();
  if (days === 0) return `היום: ${name || 'האירוע'}`;
  if (days > 0) {
    const amount = days === 1 ? 'נשאר יום אחד' : days === 2 ? 'נשארו יומיים' : `נשארו ${days} ימים`;
    return `${amount} עד ${untilPhrase(label)}`;
  }
  const past = -days;
  const amount = past === 1 ? 'עבר יום אחד' : past === 2 ? 'עברו יומיים' : `עברו ${past} ימים`;
  return `${amount} מאז ${name || 'האירוע'}`;
}

export function weeksAndDaysText(totalDays) {
  if (!Number.isInteger(totalDays) || totalDays < 0) return '';
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  const weeksPart = weeks === 1 ? 'שבוע' : weeks === 2 ? 'שבועיים' : `${weeks} שבועות`;
  if (weeks === 0) return days === 1 ? 'יום אחד' : days === 2 ? 'יומיים' : `${days} ימים`;
  if (days === 0) return weeksPart;
  const daysPart = days === 1 ? 'ויום' : days === 2 ? 'ויומיים' : `ו-${days} ימים`;
  return `${weeksPart} ${daysPart}`;
}

function addMonths(date, n) {
  const m = date.getMonth() + n;
  const lastDay = new Date(date.getFullYear(), m + 1, 0).getDate();
  return new Date(date.getFullYear(), m, Math.min(date.getDate(), lastDay), 12);
}

// הפרש בין שני תאריכים בשנים, חודשים וימים, בניסוח עברי: "חודש ו-5 ימים", "שנתיים, חודשיים ו-3 ימים".
export function monthsAndDaysText(a, b) {
  const [from, to] = a <= b ? [a, b] : [b, a];
  let months = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth();
  if (addMonths(from, months) > to) months -= 1;
  const days = daysBetween(addMonths(from, months), to);
  const years = Math.floor(months / 12);
  const monthsLeft = months % 12;

  const parts = [];
  if (years) parts.push(years === 1 ? 'שנה' : years === 2 ? 'שנתיים' : `${years} שנים`);
  if (monthsLeft) parts.push(monthsLeft === 1 ? 'חודש' : monthsLeft === 2 ? 'חודשיים' : `${monthsLeft} חודשים`);
  if (days) parts.push(days === 1 ? 'יום' : days === 2 ? 'יומיים' : `${days} ימים`);

  if (parts.length === 0) return '0 ימים';
  if (parts.length === 1) return parts[0] === 'יום' ? 'יום אחד' : parts[0];
  const last = parts[parts.length - 1];
  const joined = /^\d/.test(last) ? `ו-${last}` : `ו${last}`;
  return `${parts.slice(0, -1).join(', ')} ${joined}`;
}

export function daysBetween(a, b) {
  const utc = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((utc(b) - utc(a)) / 86400000);
}
