import { convertCurrency } from '../lib/money.js';
import { store } from '../lib/store.js';
import { loadRates, rateNote } from '../rates.js';
import { currencyOptions, formatAmount } from '../currencyUi.js';
import { readNum, bdi } from '../ui.js';

const KEY = 'cur_last';
const FAV_KEY = 'cur_favs';

export default {
  id: 'currencies',
  title: 'מטבעות',
  group: 'convert',
  icon: 'coins',
  render(container) {
    container.innerHTML = `
      <div class="card">
        <label class="field"><span>חיפוש מטבע (קוד או שם)</span><input id="c-q" type="text" autocomplete="off" placeholder="למשל EUR או יורו"></label>
        <label class="field"><span>סכום</span><input id="c-amt" type="text" inputmode="decimal" autocomplete="off" placeholder="0"></label>
        <div class="pick"><label class="field"><span>מ-</span><select id="c-from"></select></label>
          <button class="star" id="c-fs" type="button" aria-label="הוספה או הסרה ממועדפים"><i class="ph-duotone ph-star" aria-hidden="true"></i></button></div>
        <button class="swap" id="c-swap" type="button" aria-label="החלפת כיוון"><i class="ph-duotone ph-arrows-down-up" aria-hidden="true"></i></button>
        <div class="pick"><label class="field"><span>ל-</span><select id="c-to"></select></label>
          <button class="star" id="c-ts" type="button" aria-label="הוספה או הסרה ממועדפים"><i class="ph-duotone ph-star" aria-hidden="true"></i></button></div>
        <div class="result" id="c-res" aria-live="polite"></div>
        <div class="note" id="c-rate"></div>
        <div class="note" id="c-note">טוען שערים…</div>
        <div class="note"><a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">Rates By Exchange Rate API</a></div>
      </div>`;

    const $ = (s) => container.querySelector(s);
    const q = $('#c-q'), amt = $('#c-amt'), from = $('#c-from'), to = $('#c-to'), res = $('#c-res'), rateEl = $('#c-rate');
    const saved = store.get(KEY, {});
    let favs = store.get(FAV_KEY, ['USD', 'EUR', 'GBP', 'ILS']);
    let rates = null;
    let codes = [];
    let sel = { from: saved.from ?? 'USD', to: saved.to ?? 'ILS' };

    function fillSelects() {
      from.innerHTML = currencyOptions(codes, favs, sel.from, q.value);
      to.innerHTML = currencyOptions(codes, favs, sel.to, q.value);
      from.value = sel.from;
      to.value = sel.to;
    }

    function update() {
      sel = { from: from.value, to: to.value };
      store.set(KEY, sel);
      if (!rates) return;
      const a = readNum(amt);
      if (a === null || a < 0) { res.replaceChildren(); rateEl.textContent = ''; return; }
      const v = convertCurrency(a, sel.from, sel.to, rates.rates);
      if (!Number.isFinite(v)) { res.replaceChildren(); return; }
      res.replaceChildren(bdi(formatAmount(v)), ' ', sel.to);
      const unit = convertCurrency(1, sel.from, sel.to, rates.rates);
      rateEl.replaceChildren('1 ', sel.from, ' = ', bdi(formatAmount(unit)), ' ', sel.to);
    }

    function toggleFav(code) {
      favs = favs.includes(code) ? favs.filter((c) => c !== code) : [...favs, code];
      store.set(FAV_KEY, favs);
      fillSelects();
    }

    q.addEventListener('input', () => { sel = { from: from.value, to: to.value }; fillSelects(); update(); });
    amt.addEventListener('input', update);
    from.addEventListener('change', update);
    to.addEventListener('change', update);
    $('#c-swap').addEventListener('click', () => {
      const f = from.value;
      from.value = to.value;
      to.value = f;
      update();
    });
    $('#c-fs').addEventListener('click', () => toggleFav(from.value));
    $('#c-ts').addEventListener('click', () => toggleFav(to.value));

    loadRates().then((r) => {
      rates = r;
      codes = Object.keys(r.rates).sort();
      $('#c-note').textContent = rateNote(r);
      fillSelects();
      update();
    }).catch(() => {
      $('#c-note').textContent = 'אין שערים זמינים כרגע. חיבור לרשת נדרש בפעם הראשונה.';
    });
  },
};
