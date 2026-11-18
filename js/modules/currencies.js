import { convertCurrency } from '../lib/money.js';
import { store } from '../lib/store.js';
import { loadRates, rateNote } from '../rates.js';
import { currencyItems, formatAmount } from '../currencyUi.js';
import { createPicker } from '../picker.js';
import { head, readNum, bdi } from '../ui.js';

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
        ${head('המרת מטבעות', 'מזינים סכום, ובוחרים מאיזה מטבע לאיזה. אפשר לחפש מטבע לפי קוד או שם, ולסמן מטבעות מועדפים שיופיעו בראש הרשימה. למשל: 100 דולר הם כ-325 שקלים.')}
        <label class="field"><span>הסכום</span><input id="c-amt" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 100"></label>
        <div id="c-from-pick"></div>
        <button class="star" id="c-fs" type="button"></button>
        <button class="swap" id="c-swap" type="button" aria-label="החלפת כיוון"><i class="ph-duotone ph-arrows-down-up" aria-hidden="true"></i></button>
        <div id="c-to-pick"></div>
        <button class="star" id="c-ts" type="button"></button>
        <div class="result" id="c-res" aria-live="polite"></div>
        <div class="note" id="c-rate"></div>
        <div class="note" id="c-note">טוען שערים…</div>
        <div class="note"><a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">Rates By Exchange Rate API</a></div>
      </div>`;

    const $ = (s) => container.querySelector(s);
    const amt = $('#c-amt'), res = $('#c-res'), rateEl = $('#c-rate');
    const saved = store.get(KEY, {});
    let favs = store.get(FAV_KEY, ['USD', 'EUR', 'GBP', 'ILS']);
    let rates = null, codes = [], fromPick = null, toPick = null;
    let sel = { from: saved.from ?? 'USD', to: saved.to ?? 'ILS' };

    function updateStars() {
      for (const [id, code] of [['#c-fs', sel.from], ['#c-ts', sel.to]]) {
        const on = favs.includes(code);
        const btn = $(id);
        btn.replaceChildren();
        const icon = document.createElement('i');
        icon.className = 'ph-duotone ph-star';
        icon.setAttribute('aria-hidden', 'true');
        btn.append(icon, on ? ` הסר את ${code} ממועדפים` : ` הוסף את ${code} למועדפים`);
      }
    }

    function update() {
      store.set(KEY, sel);
      updateStars();
      if (!rates) return;
      const a = readNum(amt);
      if (a === null || a < 0) { res.replaceChildren(); rateEl.textContent = ''; return; }
      const v = convertCurrency(a, sel.from, sel.to, rates.rates);
      if (!Number.isFinite(v)) { res.replaceChildren(); return; }
      res.replaceChildren(bdi(formatAmount(v)), ' ', sel.to);
      const unit = convertCurrency(1, sel.from, sel.to, rates.rates);
      rateEl.replaceChildren('1 ', sel.from, ' = ', bdi(formatAmount(unit)), ' ', sel.to);
    }

    function refreshItems() {
      const items = currencyItems(codes, favs);
      fromPick.setItems(items);
      toPick.setItems(items);
    }

    function toggleFav(code) {
      favs = favs.includes(code) ? favs.filter((c) => c !== code) : [...favs, code];
      store.set(FAV_KEY, favs);
      refreshItems();
      updateStars();
    }

    amt.addEventListener('input', update);
    $('#c-swap').addEventListener('click', () => {
      sel = { from: sel.to, to: sel.from };
      fromPick.setValue(sel.from);
      toPick.setValue(sel.to);
      update();
    });
    $('#c-fs').addEventListener('click', () => toggleFav(sel.from));
    $('#c-ts').addEventListener('click', () => toggleFav(sel.to));

    loadRates().then((r) => {
      rates = r;
      codes = Object.keys(r.rates).sort();
      if (!codes.includes(sel.from)) sel.from = 'USD';
      if (!codes.includes(sel.to)) sel.to = 'ILS';
      const items = currencyItems(codes, favs);
      fromPick = createPicker({
        label: 'מ-', items, value: sel.from, placeholder: 'חיפוש מטבע: קוד או שם',
        onChange: (v) => { sel = { ...sel, from: v }; update(); },
      });
      toPick = createPicker({
        label: 'ל-', items, value: sel.to, placeholder: 'חיפוש מטבע: קוד או שם',
        onChange: (v) => { sel = { ...sel, to: v }; update(); },
      });
      $('#c-from-pick').append(fromPick.el);
      $('#c-to-pick').append(toPick.el);
      fromPick.scrollToSelected();
      toPick.scrollToSelected();
      $('#c-note').textContent = rateNote(r);
      update();
    }).catch(() => {
      $('#c-note').textContent = 'אין שערים זמינים כרגע. חיבור לרשת נדרש בפעם הראשונה.';
    });
  },
};
