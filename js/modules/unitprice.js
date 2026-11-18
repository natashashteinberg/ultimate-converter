import { compareUnitPrice } from '../lib/unitprice.js';
import { categories } from '../lib/units.js';
import { parseNumber } from '../lib/num.js';

const UNIT_IDS = [
  ...['g', 'kg', 'oz', 'lb'].map((id) => [id, categories.weight.units[id].label]),
  ...['ml', 'l', 'fl_oz', 'gal_us'].map((id) => [id, categories.volume.units[id].label]),
  ['each', 'יחידות'],
];
const BASE_LABEL = { g: 'ל-100 גרם', ml: 'ל-100 מ"ל', each: 'ליחידה' };

function fmt(n) {
  return Number(n.toPrecision(4)).toLocaleString('en-US', { maximumFractionDigits: 4 });
}

export default {
  id: 'unitprice',
  title: 'מחיר ליחידה',
  group: 'travel',
  icon: 'scales',
  render(container) {
    container.innerHTML = `
      <div id="u-rows"></div>
      <button class="add" id="u-add" type="button">הוסף פריט</button>
      <div class="callout" id="u-msg" hidden></div>`;

    const rowsEl = container.querySelector('#u-rows');
    const msg = container.querySelector('#u-msg');
    const rows = [];

    function addRow() {
      const el = document.createElement('div');
      el.className = 'card up-row';
      el.innerHTML = `
        <div class="two">
          <label class="field"><span>מחיר</span><input class="r-price" type="text" inputmode="decimal" autocomplete="off" placeholder="0"></label>
          <label class="field"><span>כמות</span><input class="r-qty" type="text" inputmode="decimal" autocomplete="off" placeholder="0"></label>
        </div>
        <label class="field"><span>יחידה</span><select class="r-unit">${UNIT_IDS.map(([id, l]) => `<option value="${id}">${l}</option>`).join('')}</select></label>
        <div class="up-out"></div>
        <button class="del" type="button">הסר פריט</button>`;
      const row = { el, price: el.querySelector('.r-price'), qty: el.querySelector('.r-qty'), unit: el.querySelector('.r-unit'), out: el.querySelector('.up-out') };
      row.price.addEventListener('input', update);
      row.qty.addEventListener('input', update);
      row.unit.addEventListener('change', update);
      el.querySelector('.del').addEventListener('click', () => {
        if (rows.length <= 2) return;
        rows.splice(rows.indexOf(row), 1);
        el.remove();
        refreshDelButtons();
        update();
      });
      rows.push(row);
      rowsEl.append(el);
      refreshDelButtons();
    }

    function refreshDelButtons() {
      for (const r of rows) r.el.querySelector('.del').hidden = rows.length <= 2;
    }

    function update() {
      msg.hidden = true;
      for (const r of rows) { r.out.textContent = ''; r.el.classList.remove('best'); }
      const valid = rows
        .map((r) => ({ r, price: parseNumber(r.price.value), qty: parseNumber(r.qty.value), unit: r.unit.value }))
        .filter((x) => x.price !== null && x.qty !== null);
      if (valid.length === 0) return;
      const cmp = compareUnitPrice(valid.map((x) => ({ price: x.price, qty: x.qty, unit: x.unit })));
      if (cmp.error) {
        msg.textContent = 'אי אפשר להשוות משקל לנפח או ליחידות. בחרי יחידות מאותו סוג.';
        msg.hidden = false;
        return;
      }
      const factor = cmp.baseUnit === 'each' ? 1 : 100;
      valid.forEach((x, i) => {
        const p = cmp.perBase[i];
        if (!Number.isFinite(p)) return;
        x.r.out.textContent = `${fmt(p * factor)} ${BASE_LABEL[cmp.baseUnit]}`;
      });
      if (valid.length > 1 && cmp.cheapestIndex >= 0) {
        const best = valid[cmp.cheapestIndex].r;
        best.el.classList.add('best');
        best.out.textContent += ' (הזול ביותר)';
      }
    }

    container.querySelector('#u-add').addEventListener('click', addRow);
    addRow();
    addRow();
  },
};
