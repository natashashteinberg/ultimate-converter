import { realCostIls, convertCurrency } from '../lib/money.js';
import { compareCards } from '../lib/cards.js';
import { formatMoney } from '../lib/num.js';
import { store } from '../lib/store.js';
import { loadRates, rateNote } from '../rates.js';
import { currencyOptions } from '../currencyUi.js';
import { createPicker } from '../picker.js';
import { head, readNum, onInput, showLines } from '../ui.js';

const KEY = 'card_last2';
const CUSTOM = 'custom';

export default {
  id: 'cardcost',
  title: 'כמה יעלה בכרטיס אשראי',
  group: 'travel',
  icon: 'credit-card',
  render(container) {
    container.innerHTML = `
      <div class="card">
        ${head('כמה יירד לי בשקלים?', 'כשקונים במטבע זר בכרטיס אשראי ישראלי, חברת האשראי מוסיפה עמלה. מזינים כמה שילמת, באיזה מטבע ובאיזה כרטיס, ורואים כמה יירד בשקלים. למשל: 100 דולר בכרטיס עם עמלה של 3% הם כ-334 שקלים.')}
        <label class="field"><span>כמה שילמת, במטבע זר?</span><input id="k-amt" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 100"></label>
        <label class="field"><span>באיזה מטבע?</span><select id="k-cur"></select></label>
        <div id="k-card-pick"></div>
        <label class="field"><span>עמלת המרה של הכרטיס (באחוזים)</span><input id="k-fee" type="text" inputmode="decimal" autocomplete="off" placeholder="0"></label>
        <details class="manual"><summary>עמלה קבועה בשקלים (לא חובה)</summary>
          <label class="field"><span>סכום קבוע שנוסף לכל עסקה (₪)</span><input id="k-fix" type="text" inputmode="decimal" autocomplete="off" placeholder="0"></label>
        </details>
        <div class="lines" id="k-res" aria-live="polite"></div>
        <div class="note" id="k-card-note"></div>
      </div>
      <div class="card">
        ${head('באיזה כרטיס זול יותר?', 'אותה קנייה, בכל הכרטיסים שברשימה, מהזול ליקר. הכרטיס שבחרת מסומן.')}
        <div id="k-compare" aria-live="polite"></div>
        <div class="note" id="k-compare-hint">מקלידים סכום כדי לראות את ההשוואה.</div>
      </div>
      <div class="note" id="k-note" style="margin-top:10px">טוען נתונים…</div>
      <div class="note"><a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">Rates By Exchange Rate API</a></div>`;

    const $ = (s) => container.querySelector(s);
    const amt = $('#k-amt'), cur = $('#k-cur'), fee = $('#k-fee'), fix = $('#k-fix'), res = $('#k-res');
    const compareEl = $('#k-compare'), compareHint = $('#k-compare-hint'), cardNote = $('#k-card-note');
    const saved = store.get(KEY, { cur: 'USD', card: 'isracard_mizrahi', fee: '', fix: '' });
    fix.value = saved.fix;
    let rates = null, data = null, picker = null, cardId = saved.card;

    function persist() { store.set(KEY, { cur: cur.value, card: cardId, fee: fee.value, fix: fix.value }); }

    function showCardNote() {
      cardNote.replaceChildren();
      const c = data?.cards.find((x) => x.id === cardId);
      if (!c) { cardNote.textContent = 'עמלה שהזנת בעצמך.'; return; }
      const link = document.createElement('a');
      link.href = c.source;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'המקור הרשמי';
      cardNote.append(`${c.note_he} `, link);
    }

    function update() {
      persist();
      res.replaceChildren();
      compareEl.replaceChildren();
      if (!rates || !data) return;
      const a = readNum(amt);
      const f = readNum(fee);
      const x = readNum(fix) ?? 0;
      compareHint.hidden = a !== null && a >= 0;
      if (a === null || a < 0 || x < 0) return;

      if (f !== null && f >= 0) {
        const base = convertCurrency(a, cur.value, 'ILS', rates.rates);
        const total = realCostIls(a, cur.value, rates.rates, f, x);
        if (Number.isFinite(total)) {
          showLines(res, [['לפי השער היום', `₪${formatMoney(base)}`], [x > 0 ? `עמלות (${f}% ועוד סכום קבוע)` : `עמלת הכרטיס (${f}%)`, `₪${formatMoney(total - base)}`], ['סכום סופי שיירד בכרטיס', `₪${formatMoney(total)}`]]);
        }
      }

      const list = data.cards.map((c) => ({ id: c.id, feePct: c.feePct, name: c.name_he }));
      if (cardId === CUSTOM && f !== null && f >= 0) list.push({ id: CUSTOM, feePct: f, name: 'העמלה שהזנת' });
      const rows = compareCards({ amount: a, from: cur.value, rates: rates.rates, cards: list, fixedFeeIls: x });
      compareEl.replaceChildren(...rows.map((r, i) => {
        const row = document.createElement('div');
        row.className = `cmp-row${i === 0 ? ' best' : ''}${r.id === cardId ? ' mine' : ''}`;
        const name = document.createElement('div');
        name.className = 'cmp-name';
        name.textContent = list.find((c) => c.id === r.id).name;
        const sub = document.createElement('div');
        sub.className = 'note';
        sub.textContent = i === 0 ? `${r.feePct}%, הכי זול` : `${r.feePct}%, יותר ב-₪${formatMoney(r.extraIls)}`;
        const left = document.createElement('div');
        left.append(name, sub);
        const total = document.createElement('div');
        total.className = 'cmp-total';
        total.textContent = `₪${formatMoney(r.totalIls)}`;
        row.append(left, total);
        return row;
      }));
    }

    function chooseCard(id, fromPicker) {
      cardId = id;
      const c = data.cards.find((x) => x.id === id);
      if (c) fee.value = String(c.feePct);
      if (!fromPicker) picker.setValue(id);
      showCardNote();
      update();
    }

    onInput([amt, fix], update);
    fee.addEventListener('input', () => {
      // הקלדה ידנית של עמלה עוברת ל"אחר".
      if (cardId !== CUSTOM) { cardId = CUSTOM; picker.setValue(CUSTOM); showCardNote(); }
      update();
    });
    cur.addEventListener('change', update);

    Promise.all([loadRates(), fetch('data/cards.json').then((r) => r.json())]).then(([r, d]) => {
      rates = r;
      data = d;
      cur.innerHTML = currencyOptions(Object.keys(r.rates).sort(), ['USD', 'EUR', 'GBP'], saved.cur);
      cur.value = saved.cur;
      const items = [
        ...[...d.cards].sort((a, b) => a.issuer_he.localeCompare(b.issuer_he, 'he')).map((c) => ({ value: c.id, label: c.name_he, search: c.issuer_he, group: c.issuer_he })),
        { value: CUSTOM, label: 'אחר: אני מזינה עמלה בעצמי', group: 'אחר' },
      ];
      if (cardId !== CUSTOM && !d.cards.some((c) => c.id === cardId)) cardId = d.cards[0].id;
      picker = createPicker({
        label: 'באיזה כרטיס שילמת?', items, value: cardId, placeholder: 'חיפוש כרטיס',
        onChange: (id) => chooseCard(id, true),
      });
      $('#k-card-pick').append(picker.el);
      picker.scrollToSelected();
      if (cardId === CUSTOM) fee.value = saved.fee; else fee.value = String(d.cards.find((c) => c.id === cardId).feePct);
      showCardNote();
      $('#k-note').textContent = `${d.note_he} נבדק ב-${d.verifiedAt}. ${rateNote(r)}`;
      update();
    }).catch(() => {
      $('#k-note').textContent = 'אין נתונים זמינים כרגע. נדרש חיבור לרשת בפעם הראשונה.';
    });
  },
};
