import { calcTip } from '../lib/tip.js';
import { formatMoney } from '../lib/num.js';
import { store } from '../lib/store.js';
import { readNum, onInput, showLines } from '../ui.js';

const KEY = 'tip_last';

export default {
  id: 'tip',
  title: 'טיפ וחלוקת חשבון',
  group: 'money',
  icon: 'hand-coins',
  render(container) {
    const saved = store.get(KEY, { basis: 'pre', pct: '18', people: '1' });
    container.innerHTML = `
      <div class="card">
        <label class="field"><span>חשבון לפני מס ($)</span><input id="t-bill" type="text" inputmode="decimal" autocomplete="off" placeholder="0"></label>
        <label class="field"><span>מס ($, לא חובה)</span><input id="t-tax" type="text" inputmode="decimal" autocomplete="off" placeholder="0"></label>
        <div class="seg" role="radiogroup" aria-label="על מה מחשבים טיפ">
          <label><input type="radio" name="tb" value="pre"><span>טיפ לפני מס</span></label>
          <label><input type="radio" name="tb" value="post"><span>טיפ אחרי מס</span></label>
        </div>
        <div class="chips" id="t-chips">
          <button type="button" data-pct="15">15%</button><button type="button" data-pct="18">18%</button><button type="button" data-pct="20">20%</button><button type="button" data-pct="25">25%</button>
        </div>
        <div class="two">
          <label class="field"><span>אחוז טיפ</span><input id="t-pct" type="text" inputmode="decimal" autocomplete="off"></label>
          <label class="field"><span>מספר אנשים</span><input id="t-people" type="text" inputmode="numeric" autocomplete="off"></label>
        </div>
        <div class="lines" id="t-res" aria-live="polite"></div>
        <div class="note" id="t-note"></div>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="note" style="margin-bottom:8px">מדריך טיפים בארה"ב</div>
        <div id="t-guide"></div>
        <div class="note" id="t-guide-src"></div>
      </div>`;

    const $ = (s) => container.querySelector(s);
    const bill = $('#t-bill'), tax = $('#t-tax'), pct = $('#t-pct'), people = $('#t-people'), res = $('#t-res'), noteEl = $('#t-note');
    const radios = [...container.querySelectorAll('input[name="tb"]')];
    radios.find((r) => r.value === saved.basis).checked = true;
    pct.value = saved.pct;
    people.value = saved.people;

    function calc() {
      const basis = radios.find((r) => r.checked).value;
      store.set(KEY, { basis, pct: pct.value, people: people.value });
      const b = readNum(bill), t = readNum(tax) ?? 0, p = readNum(pct), n = readNum(people);
      noteEl.textContent = '';
      if (b === null || p === null) { res.replaceChildren(); return; }
      const r = calcTip({ bill: b, tax: t, basis, pct: p, people: Number.isInteger(n) ? n : 0 });
      if (Number.isNaN(r.total)) { res.replaceChildren(); return; }
      const lines = [['טיפ', `$${formatMoney(r.tip)}`], ['סך הכול', `$${formatMoney(r.total)}`]];
      if (r.perPerson.length > 1) {
        const first = r.perPerson[0], last = r.perPerson[r.perPerson.length - 1];
        lines.push(['לכל אחד', `$${formatMoney(first)}`]);
        if (first !== last) noteEl.textContent = `יש הפרש של סנט: ${r.perPerson.filter((x) => x === first).length} משלמים $${formatMoney(first)} והשאר $${formatMoney(last)}.`;
      } else if (r.perPerson.length === 0) {
        noteEl.textContent = 'מספר האנשים צריך להיות מספר שלם, 1 ומעלה.';
      }
      showLines(res, lines);
    }

    onInput([bill, tax, pct, people], calc);
    radios.forEach((r) => r.addEventListener('change', calc));
    $('#t-chips').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-pct]');
      if (!b) return;
      pct.value = b.dataset.pct;
      calc();
    });

    fetch('data/tips.json').then((r) => r.json()).then((d) => {
      const guide = $('#t-guide');
      guide.replaceChildren(...d.places.map((p) => {
        const row = document.createElement('div');
        row.className = 'guide-row';
        const h = document.createElement('div');
        h.className = 'guide-h';
        h.textContent = p.he;
        const r = document.createElement('div');
        r.textContent = p.rangeText_he + (p.note_he ? `. ${p.note_he}` : '');
        row.append(h, r);
        return row;
      }));
      $('#t-guide-src').textContent = `הערכה כללית, נבדק ב-${d.verifiedAt}. מקור: NerdWallet.`;
    }).catch(() => { $('#t-guide').textContent = 'המדריך אינו זמין כרגע.'; });

    calc();
  },
};
