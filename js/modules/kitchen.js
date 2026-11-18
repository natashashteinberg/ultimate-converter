import { cupsToGrams, gramsToCups, sticksToGrams, gramsToSticks } from '../lib/kitchen.js';
import { convert, categories } from '../lib/units.js';
import { parseNumber } from '../lib/num.js';
import { showLines } from '../ui.js';

const VOLUME_IDS = ['tsp', 'tbsp', 'cup', 'fl_oz', 'ml', 'l'];
const OVEN_F = [250, 275, 300, 325, 350, 375, 400, 425, 450];
const n = (v, d = 2) => (Number.isFinite(v) ? String(Number(v.toFixed(d))) : '');

export default {
  id: 'kitchen',
  title: 'מטבח',
  group: 'convert',
  icon: 'cooking-pot',
  render(container) {
    const opts = (sel) => VOLUME_IDS.map((id) => `<option value="${id}"${id === sel ? ' selected' : ''}>${categories.volume.units[id].label}</option>`).join('');
    container.innerHTML = `
      <div class="card">
        <div class="note" style="margin-bottom:10px">נפחים</div>
        <label class="field"><span>כמות</span><input id="k-amt" type="text" inputmode="decimal" autocomplete="off" placeholder="1"></label>
        <div class="two">
          <label class="field"><span>מ-</span><select id="k-from">${opts('cup')}</select></label>
          <label class="field"><span>ל-</span><select id="k-to">${opts('ml')}</select></label>
        </div>
        <div class="result" id="k-res" aria-live="polite"></div>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="note" style="margin-bottom:10px">כוסות וגרמים לפי חומר</div>
        <label class="field"><span>חומר</span><select id="g-ing"></select></label>
        <div class="two">
          <label class="field"><span>כוסות</span><input id="g-cups" type="text" inputmode="decimal" autocomplete="off"></label>
          <label class="field"><span>גרמים</span><input id="g-grams" type="text" inputmode="decimal" autocomplete="off"></label>
        </div>
        <label class="field" id="g-stick-wrap" hidden><span>מקלות חמאה</span><input id="g-sticks" type="text" inputmode="decimal" autocomplete="off"></label>
        <div class="note" id="g-note"></div>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="note" style="margin-bottom:10px">טמפרטורת תנור</div>
        <div class="two">
          <label class="field"><span>פרנהייט</span><input id="o-f" type="text" inputmode="decimal" autocomplete="off" placeholder="350"></label>
          <label class="field"><span>צלזיוס</span><input id="o-c" type="text" inputmode="decimal" autocomplete="off"></label>
        </div>
        <div class="lines" id="o-table"></div>
      </div>`;

    const $ = (s) => container.querySelector(s);

    // נפחים
    const amt = $('#k-amt'), from = $('#k-from'), to = $('#k-to'), res = $('#k-res');
    function volume() {
      const v = parseNumber(amt.value);
      if (v === null || v < 0) { res.replaceChildren(); return; }
      const bdi = document.createElement('bdi');
      bdi.dir = 'ltr';
      bdi.textContent = n(convert('volume', v, from.value, to.value), 4);
      res.replaceChildren(bdi, ' ', categories.volume.units[to.value].label);
    }
    amt.addEventListener('input', volume);
    from.addEventListener('change', volume);
    to.addEventListener('change', volume);

    // חומרים
    const ing = $('#g-ing'), cups = $('#g-cups'), grams = $('#g-grams'), sticks = $('#g-sticks'), stickWrap = $('#g-stick-wrap');
    let data = null;
    const syncSticks = () => { stickWrap.hidden = ing.value !== 'butter'; };
    function fromCups() {
      const v = parseNumber(cups.value);
      const g = v === null ? NaN : cupsToGrams(ing.value, v, data);
      grams.value = n(g, 1);
      sticks.value = n(gramsToSticks(g, data), 2);
    }
    function fromGrams() {
      const v = parseNumber(grams.value);
      const c = v === null ? NaN : gramsToCups(ing.value, v, data);
      cups.value = n(c, 3);
      sticks.value = n(gramsToSticks(v ?? NaN, data), 2);
    }
    function fromSticks() {
      const v = parseNumber(sticks.value);
      const g = v === null ? NaN : sticksToGrams(v, data);
      grams.value = n(g, 1);
      cups.value = n(gramsToCups(ing.value, g, data), 3);
    }
    cups.addEventListener('input', () => data && fromCups());
    grams.addEventListener('input', () => data && fromGrams());
    sticks.addEventListener('input', () => data && fromSticks());
    ing.addEventListener('change', () => { syncSticks(); if (data) fromCups(); });

    // תנור
    const of = $('#o-f'), oc = $('#o-c');
    of.addEventListener('input', () => {
      const v = parseNumber(of.value);
      oc.value = v === null ? '' : n(convert('temperature', v, 'f', 'c'), 0);
    });
    oc.addEventListener('input', () => {
      const v = parseNumber(oc.value);
      of.value = v === null ? '' : n(convert('temperature', v, 'c', 'f'), 0);
    });
    showLines($('#o-table'), OVEN_F.map((f) => [`${f}°F`, `${n(convert('temperature', f, 'f', 'c'), 0)}°C`]));

    fetch('data/cooking.json').then((r) => r.json()).then((d) => {
      data = d;
      ing.innerHTML = d.ingredients.map((i) => `<option value="${i.id}">${i.he}</option>`).join('');
      $('#g-note').textContent = `${d.note_he} מקל חמאה אמריקאי הוא ${d.butterStickG} גרם. נבדק ב-${d.verifiedAt}. מקור: King Arthur Baking.`;
      syncSticks();
    }).catch(() => { $('#g-note').textContent = 'טבלת החומרים אינה זמינה כרגע.'; });
  },
};
