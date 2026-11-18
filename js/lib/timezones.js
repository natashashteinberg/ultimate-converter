const formatters = new Map();

// זורק RangeError לאזור זמן לא מוכר.
function formatter(tz) {
  if (!formatters.has(tz)) {
    formatters.set(tz, new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }));
  }
  return formatters.get(tz);
}

function partsOf(tz, ms) {
  return Object.fromEntries(formatter(tz).formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
}

export function wallTime(tz, date) {
  const p = partsOf(tz, date.getTime());
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

function offsetMs(tz, ms) {
  const p = partsOf(tz, ms);
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - ms;
}

function parse(date, time) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const [y, m, day, hh, mm] = [d[1], d[2], d[3], t[1], t[2]].map(Number);
  const check = new Date(Date.UTC(y, m - 1, day));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== day) return null;
  if (hh > 23 || mm > 59) return null;
  return Date.UTC(y, m - 1, day, hh, mm);
}

export function convertTime({ fromTz, toTz, date, time }) {
  const guess = parse(date, time);
  if (guess === null) return null;
  try {
    // שתי איטרציות כדי שהיסט שעון הקיץ יחושב לפי הרגע הנכון.
    let utc = guess - offsetMs(fromTz, guess);
    utc = guess - offsetMs(fromTz, utc);
    const out = wallTime(toTz, new Date(utc));
    const dayOffset = Math.round((Date.parse(`${out.date}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86400000);
    return { date: out.date, time: out.time, dayOffset };
  } catch {
    return null;
  }
}
