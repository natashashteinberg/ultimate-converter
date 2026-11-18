const he = new Intl.DisplayNames(['he'], { type: 'currency' });
const en = new Intl.DisplayNames(['en'], { type: 'currency' });

function nameOf(code, names) {
  try { return names.of(code) ?? code; } catch { return code; }
}

export function currencyLabel(code) {
  return `${code} · ${nameOf(code, he)}`;
}

// כינויים מקובלים שלא מופיעים בשמות הרשמיים (Intl כותב "אירו", בני אדם מחפשים "יורו").
const ALIASES = {
  EUR: 'יורו', GBP: 'פאונד לירה שטרלינג', ILS: 'שקל שקלים ש"ח', USD: 'דולר דולרים', JPY: 'ין יפני',
  CHF: 'פרנק שוויצרי', CAD: 'דולר קנדי', AUD: 'דולר אוסטרלי', TRY: 'לירה טורקית', EGP: 'לירה מצרית',
  AED: 'דירהם אמירויות', RUB: 'רובל', CNY: 'יואן סיני', THB: 'באט תאילנדי',
};

// מתאים לחיפוש לפי קוד, שם בעברית או שם באנגלית.
export function matchesCurrency(code, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return code.toLowerCase().includes(q) || (ALIASES[code] ?? '').includes(q) || nameOf(code, he).toLowerCase().includes(q) || nameOf(code, en).toLowerCase().includes(q);
}

function opt(code, selected) {
  return `<option value="${code}"${code === selected ? ' selected' : ''}>${currencyLabel(code)}</option>`;
}

export function currencyOptions(codes, favorites, selected, query = '') {
  const shown = codes.filter((c) => matchesCurrency(c, query) || c === selected);
  const favs = favorites.filter((c) => shown.includes(c));
  const rest = shown.filter((c) => !favs.includes(c));
  return (favs.length ? `<optgroup label="מועדפים">${favs.map((c) => opt(c, selected)).join('')}</optgroup>` : '')
    + `<optgroup label="כל המטבעות">${rest.map((c) => opt(c, selected)).join('')}</optgroup>`;
}

export function formatAmount(n) {
  if (!Number.isFinite(n)) return '';
  const digits = Math.abs(n) < 1 && n !== 0 ? 4 : 2;
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: digits });
}
