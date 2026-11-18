import { mountTableView } from '../sizeView.js';
import { tvDimensions } from '../lib/sizes.js';
import { convert } from '../lib/units.js';
import { parseNumber } from '../lib/num.js';
import { store } from '../lib/store.js';
import { head, showLines } from '../ui.js';

const n1 = (n) => (Number.isFinite(n) ? String(Number(n.toFixed(1))) : '');

export default {
  id: 'shopsizes',
  title: 'מידות לקניות',
  group: 'travel',
  icon: 'ruler',
  render(container) {
    container.innerHTML = `
      <div class="card" id="r-card">
        ${head('טבעות', 'בוחרים באיזו מערכת יש לך מידה (למשל ארה"ב), ואת המידה עצמה, ורואים את המידה המקבילה בשאר המערכות. למשל: מידה 7 בארה"ב היא היקף של 54.4 מ"מ.')}
        <div class="r-mount">טוען…</div>
      </div>
      <div class="card" id="m-card">
        ${head('מזרנים', 'בוחרים גודל מזרן לפי השם שלו (למשל Queen), ורואים את המידות בסנטימטרים ובאינצ\'ים.')}
        <div class="chips cats" id="m-chips" role="radiogroup" aria-label="גודל מזרן"></div>
        <div class="lines" id="m-out" aria-live="polite"></div>
      </div>
      <div class="card" id="t-card">
        ${head('טלוויזיות', 'מקלידים את גודל המסך באינצ\'ים (האלכסון) או בסנטימטרים, ורואים גם כמה רחב וגבוה המסך. למשל: טלוויזיה של 55 אינץ\' היא רחבה כ-122 ס"מ.')}
        <div class="two">
          <label class="field"><span>אינץ' (אלכסון)</span><input id="tv-in" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 55"></label>
          <label class="field"><span>סנטימטרים</span><input id="tv-cm" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 140"></label>
        </div>
        <div class="lines" id="tv-out" aria-live="polite"></div>
        <div class="note">מידות הגוף של מסך ביחס 16:9, בלי המסגרת והרגליים.</div>
      </div>
      <div class="note" id="k-note" style="margin-top:24px"></div>`;

    const $ = (s) => container.querySelector(s);

    // טלוויזיה
    const tvIn = $('#tv-in'), tvCm = $('#tv-cm'), tvOut = $('#tv-out');
    function tvResult(inches) {
      const d = tvDimensions(inches);
      if (!Number.isFinite(d.wCm)) { tvOut.replaceChildren(); return; }
      showLines(tvOut, [['רוחב', `${n1(d.wCm)} ס"מ`], ['גובה', `${n1(d.hCm)} ס"מ`]]);
    }
    tvIn.addEventListener('input', () => {
      const v = parseNumber(tvIn.value);
      tvCm.value = v === null || v <= 0 ? '' : n1(convert('length', v, 'in', 'cm'));
      tvResult(v ?? NaN);
    });
    tvCm.addEventListener('input', () => {
      const v = parseNumber(tvCm.value);
      const inches = v === null || v <= 0 ? NaN : convert('length', v, 'cm', 'in');
      tvIn.value = n1(inches);
      tvResult(inches);
    });

    fetch('data/sizes.json').then((r) => r.json()).then((d) => {
      mountTableView($('#r-card .r-mount'), [d.tables.find((t) => t.id === 'ring')], 'ring_last');

      // מזרנים: בוחרים לפי שם ורואים סנטימטרים ואינצ'ים.
      const chips = $('#m-chips'), out = $('#m-out');
      let current = store.get('mattress_last', 'queen');
      if (!d.mattress.some((m) => m.id === current)) current = 'queen';
      chips.replaceChildren(...d.mattress.map((m) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.id = m.id;
        b.textContent = m.he;
        b.setAttribute('role', 'radio');
        return b;
      }));
      function showMattress() {
        store.set('mattress_last', current);
        const m = d.mattress.find((x) => x.id === current);
        for (const b of chips.children) {
          b.classList.toggle('on', b.dataset.id === current);
          b.setAttribute('aria-checked', String(b.dataset.id === current));
        }
        showLines(out, [['בסנטימטרים (רוחב × אורך)', `${m.cm_w} × ${m.cm_l}`], ['באינצ\'ים (רוחב × אורך)', `${m.in_w} × ${m.in_l}`]]);
      }
      chips.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-id]');
        if (!b) return;
        current = b.dataset.id;
        showMattress();
      });
      showMattress();

      $('#k-note').textContent = `${d.note_he} נבדק ב-${d.verifiedAt}. מקור: ויקיפדיה. גדלי המזרנים הם הסטנדרט בצפון אמריקה.`;
    }).catch(() => { $('#k-note').textContent = 'הטבלאות אינן זמינות כרגע.'; });
  },
};
