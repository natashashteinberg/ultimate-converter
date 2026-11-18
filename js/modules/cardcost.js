import { realCostIls, convertCurrency } from '../lib/money.js';
import { formatMoney } from '../lib/num.js';
import { store } from '../lib/store.js';
import { loadRates, rateNote } from '../rates.js';
import { currencyOptions } from '../currencyUi.js';
import { readNum, onInput, showLines } from '../ui.js';

export default {
  id: 'cardcost',
  title: 'עלות אמיתית בכרטיס אשראי',
  group: 'travel',
  icon: 'credit-card',
  render(container) {
    container.innerHTML = `
      <div class="card">
        <label class="field"><span>סכום במטבע זר</span><input id="k-amt" type="text" inputmode="decimal" autocomplete="off" placeholder="0"></label>
        <label class="field"><span>מטבע</span><select id="k-cur"></select></label>
        <div class="two">
          <label class="field"><span>עמלת המרה (%)</span><input id="k-fee" type="text" inputmode="decimal" autocomplete="off" placeholder="0"></label>
          <label class="field"><span>עמלה קבועה (₪)</span><input id="k-fix" type="text" inputmode="decimal" autocomplete="off" placeholder="0"></label>
        </div>
        <div class="lines" id="k-res" aria-live="polite"></div>
        <div class="note">את אחוז העמלה אפשר למצוא בפירוט של חברת האשראי. הערך נשמר במכשיר.</div>
        <div class="note" id="k-note">טוען שערים…</div>
        <div class="note"><a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">Rates By Exchange Rate API</a></div>
      </div>`;

    const $ = (s) => container.querySelector(s);
    const amt = $('#k-amt'), cur = $('#k-cur'), fee = $('#k-fee'), fix = $('#k-fix'), res = $('#k-res');
    const saved = store.get('card_last', { cur: 'USD', fee: '', fix: '' });
    fee.value = saved.fee;
    fix.value = saved.fix;
    let rates = null;

    function update() {
      store.set('card_last', { cur: cur.value, fee: fee.value, fix: fix.value });
      if (!rates) return;
      const a = readNum(amt);
      const f = readNum(fee) ?? 0, x = readNum(fix) ?? 0;
      if (a === null || a < 0 || f < 0 || x < 0) { res.replaceChildren(); return; }
      const base = convertCurrency(a, cur.value, 'ILS', rates.rates);
      const total = realCostIls(a, cur.value, rates.rates, f, x);
      if (!Number.isFinite(total)) { res.replaceChildren(); return; }
      showLines(res, [['לפי השער', `₪${formatMoney(base)}`], ['עמלות', `₪${formatMoney(total - base)}`], ['יירד בכרטיס', `₪${formatMoney(total)}`]]);
    }
    onInput([amt, fee, fix], update);
    cur.addEventListener('change', update);

    loadRates().then((r) => {
      rates = r;
      cur.innerHTML = currencyOptions(Object.keys(r.rates).sort(), ['USD', 'EUR', 'GBP'], saved.cur);
      cur.value = saved.cur;
      $('#k-note').textContent = rateNote(r);
      update();
    }).catch(() => {
      $('#k-note').textContent = 'אין שערים זמינים כרגע. חיבור לרשת נדרש בפעם הראשונה.';
    });
  },
};
