import { compareUnitPrice, percentCheaper } from '../lib/unitprice.js';
import { parseNumber } from '../lib/num.js';

// כל סוג השוואה: יחידות מתאימות, הניסוח של השדה, ומה מוצג בתוצאה.
const KINDS = {
  weight: {
    label: 'משקל', field: 'המשקל שכתוב על האריזה', hint: 'למשל: 500 גרם',
    units: [['g', 'גרם'], ['kg', 'ק"ג'], ['oz', 'אונקיה'], ['lb', 'פאונד']], result: 'כל 100 גרם עולים', factor: 100, example: 'גרם מול פאונד',
  },
  volume: {
    label: 'נפח', field: 'הנפח שכתוב על האריזה', hint: 'למשל: 1 ליטר',
    units: [['ml', 'מ"ל'], ['l', 'ליטר'], ['fl_oz', 'אונקיית נוזל'], ['gal_us', 'גלון']], result: 'כל 100 מ"ל עולים', factor: 100, example: 'ליטר מול גלון',
  },
  each: {
    label: 'יחידות', field: 'מספר היחידות באריזה', hint: 'למשל: 6 בקבוקים',
    units: [['each', 'יחידות']], result: 'כל יחידה עולה', factor: 1,
  },
};
const NAMES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];

function fmt(n) {
  return Number(n.toPrecision(4)).toLocaleString('en-US', { maximumFractionDigits: 4 });
}

export default {
  id: 'unitprice',
  title: 'מה משתלם יותר?',
  group: 'travel',
  icon: 'scales',
  render(container) {
    container.innerHTML = `
      <div class="note" style="margin:0 0 12px;font-size:15px">משווים שני מוצרים או יותר, ורואים איזה זול יותר. קודם בוחרים מה משווים.</div>
      <div class="card">
        <div class="note" style="margin:0 0 8px">מה משווים?</div>
        <div class="seg three" role="radiogroup" aria-label="מה משווים">
          ${Object.entries(KINDS).map(([id, k], i) => `<label><input type="radio" name="uk" value="${id}"${i === 0 ? ' checked' : ''}><span>${k.label}</span></label>`).join('')}
        </div>
        <div class="note" style="margin:0" id="u-kind-hint"></div>
      </div>
      <div id="u-rows"></div>
      <div class="callout" id="u-summary" hidden aria-live="polite"></div>
      <button class="add" id="u-add" type="button">הוסף מוצר</button>`;

    const rowsEl = container.querySelector('#u-rows');
    const summary = container.querySelector('#u-summary');
    const radios = [...container.querySelectorAll('input[name="uk"]')];
    const rows = [];
    const kindId = () => radios.find((r) => r.checked).value;

    function applyKind(row) {
      const k = KINDS[kindId()];
      row.fieldLabel.textContent = k.field;
      row.unit.innerHTML = k.units.map(([id, l]) => `<option value="${id}">${l}</option>`).join('');
      row.unit.disabled = k.units.length === 1;
      row.qty.placeholder = k.hint;
    }

    function addRow() {
      const el = document.createElement('div');
      el.className = 'card up-row';
      el.innerHTML = `
        <div class="up-title"></div>
        <label class="field"><span>המחיר שכתוב על האריזה</span><input class="r-price" type="text" inputmode="decimal" autocomplete="off" placeholder="0"></label>
        <div class="field"><span class="r-field"></span>
          <div class="qty-row">
            <input class="r-qty" type="text" inputmode="decimal" autocomplete="off" aria-label="המספר שכתוב על האריזה">
            <select class="r-unit" aria-label="יחידת מידה"></select>
          </div>
        </div>
        <div class="up-out" aria-live="polite"></div>
        <button class="del" type="button">הסר מוצר</button>`;
      const row = {
        el, price: el.querySelector('.r-price'), qty: el.querySelector('.r-qty'), unit: el.querySelector('.r-unit'),
        out: el.querySelector('.up-out'), title: el.querySelector('.up-title'), fieldLabel: el.querySelector('.r-field'),
      };
      applyKind(row);
      row.price.addEventListener('input', update);
      row.qty.addEventListener('input', update);
      row.unit.addEventListener('change', update);
      el.querySelector('.del').addEventListener('click', () => {
        if (rows.length <= 2) return;
        rows.splice(rows.indexOf(row), 1);
        el.remove();
        renumber();
        update();
      });
      rows.push(row);
      rowsEl.append(el);
      renumber();
    }

    function renumber() {
      rows.forEach((r, i) => {
        r.title.textContent = `מוצר ${NAMES[i] ?? i + 1}`;
        r.el.querySelector('.del').hidden = rows.length <= 2;
      });
    }

    function update() {
      summary.hidden = true;
      for (const r of rows) { r.out.textContent = ''; r.el.classList.remove('best'); }
      const k = KINDS[kindId()];
      const valid = rows
        .map((r) => ({ r, price: parseNumber(r.price.value), qty: parseNumber(r.qty.value), unit: r.unit.value }))
        .filter((x) => x.price !== null && x.qty !== null);
      if (valid.length === 0) return;
      const cmp = compareUnitPrice(valid.map((x) => ({ price: x.price, qty: x.qty, unit: x.unit })));
      if (cmp.error) return;
      valid.forEach((x, i) => {
        const p = cmp.perBase[i];
        if (Number.isFinite(p)) x.r.out.textContent = `${k.result} ${fmt(p * k.factor)}`;
      });
      if (valid.length < 2 || cmp.cheapestIndex < 0) return;

      const best = valid[cmp.cheapestIndex];
      best.r.el.classList.add('best');
      const others = valid.map((x, i) => ({ x, p: cmp.perBase[i] })).filter((o, i) => i !== cmp.cheapestIndex && Number.isFinite(o.p));
      if (others.length === 0) return;
      const worst = others.reduce((a, b) => (b.p > a.p ? b : a));
      const pct = percentCheaper(cmp.perBase[cmp.cheapestIndex], worst.p);
      summary.textContent = pct === 0
        ? 'המחירים זהים.'
        : `${best.r.title.textContent} משתלם יותר. הוא זול ב-${pct}% מ${worst.x.r.title.textContent}.`;
      summary.hidden = false;
    }

    function onKindChange() {
      const k = KINDS[kindId()];
      container.querySelector('#u-kind-hint').textContent = k.units.length === 1
        ? 'כל המוצרים נמדדים ביחידות.'
        : `כל המוצרים נמדדים ב${k.label}. לכל מוצר אפשר לבחור יחידה אחרת, למשל ${k.example}.`;
      for (const r of rows) applyKind(r);
      update();
    }

    radios.forEach((r) => r.addEventListener('change', onKindChange));
    container.querySelector('#u-add').addEventListener('click', addRow);
    addRow();
    addRow();
    onKindChange();
  },
};
