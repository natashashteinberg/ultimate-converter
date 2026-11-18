import { mountTableView } from '../sizeView.js';
import { tvDimensions } from '../lib/sizes.js';
import { convert } from '../lib/units.js';
import { parseNumber } from '../lib/num.js';
import { showLines } from '../ui.js';

const KINDS = [['bra', 'חזיות'], ['ring', 'טבעות'], ['mattress', 'מזרנים'], ['tv', 'טלוויזיות']];
const n1 = (n) => (Number.isFinite(n) ? String(Number(n.toFixed(1))) : '');

export default {
  id: 'shopsizes',
  title: 'מידות לקניות בארה"ב',
  group: 'travel',
  icon: 'ruler',
  render(container) {
    container.innerHTML = `
      <div class="card">
        <label class="field"><span>מה קונים?</span><select id="k-kind">${KINDS.map(([id, l]) => `<option value="${id}">${l}</option>`).join('')}</select></label>
        <div id="k-bra"></div>
        <div id="k-ring" hidden></div>
        <div id="k-mattress" hidden></div>
        <div id="k-tv" hidden>
          <div class="two">
            <label class="field"><span>אינץ' (אלכסון)</span><input id="tv-in" type="text" inputmode="decimal" autocomplete="off" placeholder="55"></label>
            <label class="field"><span>סנטימטרים</span><input id="tv-cm" type="text" inputmode="decimal" autocomplete="off"></label>
          </div>
          <div class="lines" id="tv-out" aria-live="polite"></div>
          <div class="note">מידות הגוף של מסך ביחס 16:9, בלי המסגרת והרגליים.</div>
        </div>
        <div class="note" id="k-note"></div>
      </div>`;

    const $ = (s) => container.querySelector(s);
    const kind = $('#k-kind');
    const panels = Object.fromEntries(KINDS.map(([id]) => [id, $(`#k-${id}`)]));
    const show = () => { for (const [id, el] of Object.entries(panels)) el.hidden = id !== kind.value; };
    kind.addEventListener('change', show);

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
      mountTableView(panels.bra, [d.tables.find((t) => t.id === 'bra')], 'bra_last');
      mountTableView(panels.ring, [d.tables.find((t) => t.id === 'ring')], 'ring_last');
      panels.mattress.replaceChildren(...d.mattress.map((m) => {
        const row = document.createElement('div');
        row.className = 'guide-row';
        const h = document.createElement('div');
        h.className = 'guide-h';
        h.textContent = m.he;
        const t = document.createElement('div');
        t.textContent = `${m.cm_w} × ${m.cm_l} ס"מ (${m.in_w} × ${m.in_l} אינץ')`;
        row.append(h, t);
        return row;
      }));
      $('#k-note').textContent = `${d.note_he} בחזיות מוצג רק היקף החזייה, וגודל הכוסית משתנה בין מדינות. נבדק ב-${d.verifiedAt}. מקור: ויקיפדיה.`;
    }).catch(() => { $('#k-note').textContent = 'הטבלאות אינן זמינות כרגע.'; });
    show();
  },
};
