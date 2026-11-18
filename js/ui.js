import { parseNumber } from './lib/num.js';

export function bdi(text) {
  const b = document.createElement('bdi');
  b.dir = 'ltr';
  b.textContent = text;
  return b;
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
