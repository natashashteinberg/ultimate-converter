import { categories, convert } from './lib/units.js';
import { parseNumber } from './lib/num.js';
import { store } from './lib/store.js';
import { head, bdi } from './ui.js';

function fmt(n, digits) {
  return Number(n.toPrecision(10)).toLocaleString('en-US', { maximumFractionDigits: digits });
}

// ממיר פשוט לקטגוריה אחת: ערך, יחידת מקור, יחידת יעד ותוצאה. משמש לטמפרטורה ולזמן.
export function mountSimpleConverter(root, { category, defaults, title, help, note = '', placeholder = '', storeKey, digits = 6 }) {
  const units = categories[category].units;
  const saved = store.get(storeKey, {});
  const from0 = units[saved.from] ? saved.from : defaults[0];
  const to0 = units[saved.to] ? saved.to : defaults[1];
  const options = (sel) => Object.entries(units).map(([id, u]) => `<option value="${id}"${id === sel ? ' selected' : ''}>${u.label}</option>`).join('');

  root.innerHTML = `
    <div class="card">
      ${head(title, help)}
      <label class="field"><span>הערך שרוצים להמיר</span><input class="sc-val" type="text" inputmode="decimal" autocomplete="off" placeholder="${placeholder}"></label>
      <label class="field"><span>מ-</span><select class="sc-from">${options(from0)}</select></label>
      <button class="swap sc-swap" type="button" aria-label="החלפת כיוון"><i class="ph-duotone ph-arrows-down-up" aria-hidden="true"></i></button>
      <label class="field"><span>ל-</span><select class="sc-to">${options(to0)}</select></label>
      <div class="result sc-res" aria-live="polite"></div>
      ${note ? `<div class="note">${note}</div>` : ''}
    </div>`;

  const $ = (s) => root.querySelector(s);
  const val = $('.sc-val'), from = $('.sc-from'), to = $('.sc-to'), res = $('.sc-res');

  function update() {
    store.set(storeKey, { from: from.value, to: to.value });
    const v = parseNumber(val.value);
    if (v === null) { res.replaceChildren(); return; }
    res.replaceChildren(bdi(fmt(convert(category, v, from.value, to.value), digits)), ' ', units[to.value].label);
  }

  val.addEventListener('input', update);
  from.addEventListener('change', update);
  to.addEventListener('change', update);
  $('.sc-swap').addEventListener('click', () => {
    const f = from.value;
    from.value = to.value;
    to.value = f;
    update();
  });
  update();
}
