import { taxFor, categoriesFor } from '../lib/ustax.js';
import { convertCurrency } from '../lib/money.js';
import { formatMoney } from '../lib/num.js';
import { store } from '../lib/store.js';
import { loadRates, rateNote } from '../rates.js';
import { loadTaxData } from '../taxData.js';
import { createPicker } from '../picker.js';
import { head, readNum, onInput, showLines } from '../ui.js';

const KEY = 'ustax_last';
const CATEGORY_LABEL = { general: 'כללי', clothing: 'בגדים ונעליים' };

export default {
  id: 'ustax',
  title: 'מס אמריקאי',
  subtitle: 'מחיר, מדינה וסכום סופי בשקלים',
  group: 'main',
  icon: 'receipt',
  render(container) {
    container.innerHTML = `
      <div class="card">
        ${head('כמה זה יעלה לי עם המס?', 'בארה"ב המחיר על המדף לא כולל מס מכירה, והמס מתווסף בקופה. מזינים את המחיר ומדינה, ורואים את המס ואת הסכום הסופי בדולרים ובשקלים. בחלק מהמדינות בגדים פטורים ממס, ואז יופיע כפתור "בגדים ונעליים".')}
        <label class="field"><span>המחיר על המדף ($)</span><input id="x-price" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 49.99"></label>
        <div id="x-state-pick"></div>
        <div id="x-cats-wrap" hidden>
          <div class="note" style="margin:0 0 6px">סוג מוצר</div>
          <div class="chips cats" id="x-cats" role="radiogroup" aria-label="סוג מוצר"></div>
        </div>
        <details class="manual"><summary>שיעור ידני</summary>
          <label class="field"><span>שיעור מס באחוזים (אם ידוע לך מהקבלה)</span><input id="x-rate" type="text" inputmode="decimal" autocomplete="off"></label>
        </details>
        <div class="callout" id="x-note" hidden></div>
        <div class="lines" id="x-res" aria-live="polite"></div>
        <div class="note" id="x-info">טוען נתונים…</div>
      </div>`;

    const $ = (s) => container.querySelector(s);
    const price = $('#x-price'), catsWrap = $('#x-cats-wrap');
    const cats = $('#x-cats'), rateIn = $('#x-rate'), noteEl = $('#x-note'), res = $('#x-res'), info = $('#x-info');
    const saved = store.get(KEY, { state: 'NJ' });
    let data = null, usd = null, category = 'general', state = saved.state, picker = null;

    function fillCategories() {
      const available = categoriesFor(state, data);
      if (!available.includes(category)) category = 'general';
      catsWrap.hidden = available.length < 2;
      cats.replaceChildren(...available.map((c) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.cat = c;
        b.textContent = CATEGORY_LABEL[c] ?? c;
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(c === category));
        if (c === category) b.classList.add('on');
        return b;
      }));
    }

    function calc() {
      const p = readNum(price);
      store.set(KEY, { state });
      noteEl.hidden = true;
      if (!data || p === null) { res.replaceChildren(); return; }
      const override = readNum(rateIn);
      const r = taxFor({ price: p, state, category, rateOverridePct: override ?? undefined }, data);
      if (r.note_he) {
        noteEl.textContent = r.note_he;
        noteEl.hidden = false;
      }
      if (p <= 0) { res.replaceChildren(); return; }
      const lines = [
        ['לפני מס', `$${formatMoney(p)}`],
        [r.exempt ? 'מס (פטור)' : `מס (${Number(r.ratePct.toFixed(2))}%)`, `$${formatMoney(r.tax)}`],
        ['סך הכול', `$${formatMoney(r.total)}`],
      ];
      if (usd) lines.push(['בשקלים', `₪${formatMoney(convertCurrency(r.total, 'USD', 'ILS', usd.rates))}`]);
      showLines(res, lines);
    }

    onInput([price, rateIn], calc);
    cats.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-cat]');
      if (!b) return;
      category = b.dataset.cat;
      for (const x of cats.children) {
        x.classList.toggle('on', x === b);
        x.setAttribute('aria-checked', String(x === b));
      }
      calc();
    });

    Promise.all([loadTaxData(), loadRates().catch(() => null)]).then(([d, r]) => {
      data = d;
      usd = r;
      if (!data.rates[state]) state = 'NJ';
      const items = Object.entries(data.rates)
        .sort((a, b) => a[1].name_he.localeCompare(b[1].name_he, 'he'))
        .map(([code, rate]) => ({ value: code, label: rate.name_he, search: code }));
      picker = createPicker({
        label: 'מדינה',
        items,
        value: state,
        placeholder: 'חיפוש מדינה, למשל ניו יורק',
        onChange: (code) => { state = code; fillCategories(); calc(); },
      });
      $('#x-state-pick').append(picker.el);
      picker.scrollToSelected();
      fillCategories();
      info.textContent = `הערכה בלבד: המס המקומי משתנה מעיר לעיר. שיעורים נבדקו ב-${d.ratesVerifiedAt}, כללי פטור ב-${d.rulesVerifiedAt}. ${r ? rateNote(r) : 'אין שער דולר זמין, ולכן לא מוצג סכום בשקלים.'}`;
      calc();
    }).catch(() => { info.textContent = 'לא ניתן לטעון את נתוני המס. נדרש חיבור לרשת בפעם הראשונה.'; });
  },
};
