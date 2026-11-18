import { addVat, removeVat, percentOf, whatPercent, percentChange } from '../lib/percent.js';
import { formatMoney } from '../lib/num.js';
import { store } from '../lib/store.js';
import { readNum, onInput, showLines } from '../ui.js';

const num = (n) => Number(n.toPrecision(10)).toLocaleString('en-US', { maximumFractionDigits: 4 });

export default {
  id: 'vat',
  title: 'מע"מ ואחוזים',
  group: 'money',
  icon: 'percent',
  render(container) {
    container.innerHTML = `
      <div class="card">
        <div class="seg" role="radiogroup" aria-label="סוג חישוב">
          <label><input type="radio" name="vm" value="add" checked><span>הוספת מע"מ</span></label>
          <label><input type="radio" name="vm" value="remove"><span>הסרת מע"מ</span></label>
        </div>
        <label class="field"><span id="v-amount-l">סכום לפני מע"מ</span><input id="v-amount" type="text" inputmode="decimal" autocomplete="off" placeholder="0"></label>
        <label class="field"><span>שיעור מע"מ באחוזים</span><input id="v-rate" type="text" inputmode="decimal" autocomplete="off"></label>
        <div class="lines" id="v-res" aria-live="polite"></div>
        <div class="note">שיעור המע"מ הנוכחי בישראל הוא 18% (נכון ל-2026). אפשר לשנות.</div>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="note" style="margin-bottom:10px">כמה זה X אחוז מ-Y</div>
        <div class="two">
          <label class="field"><span>אחוז</span><input id="p1a" type="text" inputmode="decimal" autocomplete="off"></label>
          <label class="field"><span>מתוך</span><input id="p1b" type="text" inputmode="decimal" autocomplete="off"></label>
        </div>
        <div class="lines" id="p1r" aria-live="polite"></div>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="note" style="margin-bottom:10px">X הוא כמה אחוז מ-Y</div>
        <div class="two">
          <label class="field"><span>X</span><input id="p2a" type="text" inputmode="decimal" autocomplete="off"></label>
          <label class="field"><span>Y</span><input id="p2b" type="text" inputmode="decimal" autocomplete="off"></label>
        </div>
        <div class="lines" id="p2r" aria-live="polite"></div>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="note" style="margin-bottom:10px">שינוי באחוזים</div>
        <div class="two">
          <label class="field"><span>מ-</span><input id="p3a" type="text" inputmode="decimal" autocomplete="off"></label>
          <label class="field"><span>ל-</span><input id="p3b" type="text" inputmode="decimal" autocomplete="off"></label>
        </div>
        <div class="lines" id="p3r" aria-live="polite"></div>
      </div>`;

    const $ = (s) => container.querySelector(s);
    const amount = $('#v-amount'), rate = $('#v-rate'), res = $('#v-res'), label = $('#v-amount-l');
    const radios = [...container.querySelectorAll('input[name="vm"]')];
    rate.value = String(store.get('vat_rate', 18));

    function vat() {
      const mode = radios.find((r) => r.checked).value;
      label.textContent = mode === 'add' ? 'סכום לפני מע"מ' : 'סכום כולל מע"מ';
      store.set('vat_rate', readNum(rate) ?? 18);
      const a = readNum(amount), r = readNum(rate);
      if (a === null || r === null || a < 0 || r < 0) { res.replaceChildren(); return; }
      if (mode === 'add') {
        const o = addVat(a, r);
        showLines(res, [['לפני מע"מ', formatMoney(a)], ['מע"מ', formatMoney(o.vat)], ['כולל מע"מ', formatMoney(o.gross)]]);
      } else {
        const o = removeVat(a, r);
        showLines(res, [['כולל מע"מ', formatMoney(a)], ['מע"מ', formatMoney(o.vat)], ['לפני מע"מ', formatMoney(o.net)]]);
      }
    }
    onInput([amount, rate], vat);
    radios.forEach((r) => r.addEventListener('change', vat));

    function pair(a, b, out, fn, label, suffix = '') {
      const calc = () => {
        const x = readNum(a), y = readNum(b);
        const v = x === null || y === null ? NaN : fn(x, y);
        if (!Number.isFinite(v)) { out.replaceChildren(); return; }
        showLines(out, [[label, num(v) + suffix]]);
      };
      onInput([a, b], calc);
    }
    pair($('#p1a'), $('#p1b'), $('#p1r'), percentOf, 'התוצאה');
    pair($('#p2a'), $('#p2b'), $('#p2r'), whatPercent, 'אחוז', '%');
    pair($('#p3a'), $('#p3b'), $('#p3r'), percentChange, 'שינוי', '%');
  },
};
