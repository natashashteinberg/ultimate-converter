import { parseNumber } from './lib/num.js';

export function bdi(text) {
  // bdi בלי כיוון קבוע: הדפדפן בוחר לפי האות החזקה הראשונה. מספרים וסימני מטבע נשארים משמאל לימין,
  // וטקסט שמתחיל בעברית (תאריכים, "5 שבועות") מוצג מימין לשמאל ולא הפוך.
  const b = document.createElement('bdi');
  b.textContent = text;
  return b;
}

// כותרת בולטת והסבר קצר לכל שאילתה במסך. המחרוזות סטטיות, בלי קלט של משתמש.
export function head(title, help = '') {
  return `<h2 class="sec-title">${title}</h2>${help ? `<p class="sec-help">${help}</p>` : ''}`;
}

export function readNum(input) {
  return parseNumber(input.value);
}

export function onInput(inputs, fn) {
  for (const i of inputs) i.addEventListener('input', fn);
}

// מציג שורות "תווית: ערך" באזור תוצאה בלי לגעת בשדות הקלט.
export function showLines(target, lines) {
  target.replaceChildren(
    ...lines.map(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'line';
      const l = document.createElement('span');
      l.textContent = label;
      row.append(l, bdi(value));
      return row;
    }),
  );
}
