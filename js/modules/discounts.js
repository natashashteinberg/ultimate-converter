import { applyDiscounts, whatPercent } from '../lib/percent.js';
import { formatMoney } from '../lib/num.js';
import { head, readNum, onInput, showLines } from '../ui.js';

export default {
  id: 'discounts',
  title: 'הנחות',
  group: 'money',
  icon: 'tag',
  render(container) {
    container.innerHTML = `
      <div class="card">
        ${head('כמה עולה אחרי ההנחה?', 'מזינים את המחיר המקורי ואת אחוז ההנחה (אפשר גם הנחה שנייה, כמו "עוד 10% בקופה"), ורואים את המחיר הסופי ואת החיסכון. למשל: 100 עם הנחה של 20% ועוד 10% הם 72.')}
        <label class="field"><span>המחיר המקורי</span><input id="d-price" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 100"></label>
        <div class="two">
          <label class="field"><span>הנחה ראשונה (%)</span><input id="d-1" type="text" inputmode="decimal" autocomplete="off"></label>
          <label class="field"><span>הנחה שנייה (%)</span><input id="d-2" type="text" inputmode="decimal" autocomplete="off"></label>
        </div>
        <div class="lines" id="d-res" aria-live="polite"></div>
        <div class="note">ההנחה השנייה מחושבת על המחיר שאחרי הראשונה.</div>
      </div>`;

    const $ = (s) => container.querySelector(s);
    const price = $('#d-price'), d1 = $('#d-1'), d2 = $('#d-2'), res = $('#d-res');

    function calc() {
      const p = readNum(price);
      if (p === null) { res.replaceChildren(); return; }
      const discounts = [readNum(d1), readNum(d2)].filter((d) => d !== null);
      const o = applyDiscounts(p, discounts);
      if (Number.isNaN(o.final)) { res.replaceChildren(); return; }
      const lines = [['מחיר אחרי הנחה', formatMoney(o.final)], ['חסכת', formatMoney(o.saved)]];
      const pct = whatPercent(o.saved, p);
      if (Number.isFinite(pct)) lines.push(['סך ההנחה', `${Number(pct.toFixed(2))}%`]);
      showLines(res, lines);
    }
    onInput([price, d1, d2], calc);
  },
};
