import { addVat, removeVat } from '../lib/percent.js';
import { formatMoney } from '../lib/num.js';
import { store } from '../lib/store.js';
import { head, readNum, onInput, showLines } from '../ui.js';

export default {
  id: 'vat',
  title: 'מע"מ',
  group: 'money',
  icon: 'invoice',
  render(container) {
    container.innerHTML = `
      <div class="card">
        ${head('חישוב מע"מ', 'בוחרים אם יש לך סכום לפני מע"מ ורוצים להוסיף אותו, או סכום כולל מע"מ ורוצים לדעת כמה היה לפניו וכמה מע"מ שולם. למשל: 100 לפני מע"מ הם 118 כולל מע"מ.')}
        <div class="seg" role="radiogroup" aria-label="סוג חישוב">
          <label><input type="radio" name="vm" value="add" checked><span>להוסיף מע"מ</span></label>
          <label><input type="radio" name="vm" value="remove"><span>להסיר מע"מ</span></label>
        </div>
        <label class="field"><span id="v-amount-l">הסכום לפני מע"מ</span><input id="v-amount" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 100"></label>
        <label class="field"><span>שיעור המע"מ (באחוזים)</span><input id="v-rate" type="text" inputmode="decimal" autocomplete="off"></label>
        <div class="lines" id="v-res" aria-live="polite"></div>
        <div class="note">שיעור המע"מ הנוכחי בישראל הוא 18% (נכון ל-2026). אפשר לשנות.</div>
      </div>`;

    const $ = (s) => container.querySelector(s);
    const amount = $('#v-amount'), rate = $('#v-rate'), res = $('#v-res'), label = $('#v-amount-l');
    const radios = [...container.querySelectorAll('input[name="vm"]')];
    rate.value = String(store.get('vat_rate', 18));

    function vat() {
      const mode = radios.find((r) => r.checked).value;
      label.textContent = mode === 'add' ? 'הסכום לפני מע"מ' : 'הסכום כולל מע"מ';
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
  },
};
