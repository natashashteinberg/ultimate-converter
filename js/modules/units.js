import { categories, convert, ftInToCm, cmToFtIn } from '../lib/units.js';
import { parseNumber } from '../lib/num.js';
import { store } from '../lib/store.js';

const KEY = 'units_last';
const DEFAULTS = {
  length: ['in', 'cm'], weight: ['lb', 'kg'], volume: ['gal_us', 'l'], area: ['ft2', 'm2'],
  temperature: ['f', 'c'], speed: ['mph', 'kmh'], energy: ['kcal', 'kj'], pressure: ['psi', 'bar'],
};

function fmt(n) {
  if (!Number.isFinite(n)) return '';
  return Number(n.toPrecision(10)).toLocaleString('en-US', { maximumFractionDigits: 6 });
}

function options(units, selected) {
  return Object.entries(units)
    .map(([id, u]) => `<option value="${id}"${id === selected ? ' selected' : ''}>${u.label}</option>`)
    .join('');
}

export default {
  id: 'units',
  title: 'מידות',
  group: 'convert',
  icon: 'ruler',
  render(container) {
    const saved = store.get(KEY, {});
    let cat = categories[saved.cat] ? saved.cat : 'length';

    container.innerHTML = `
      <div class="card">
        <label class="field"><span>סוג</span>
          <select id="u-cat">${Object.entries(categories).map(([id, c]) => `<option value="${id}"${id === cat ? ' selected' : ''}>${c.label}</option>`).join('')}</select>
        </label>
        <label class="field"><span>ערך</span>
          <input id="u-val" type="text" inputmode="decimal" autocomplete="off" placeholder="0">
        </label>
        <label class="field"><span>מ-</span><select id="u-from"></select></label>
        <button class="swap" id="u-swap" type="button" aria-label="החלפת כיוון"><i class="ph-duotone ph-arrows-down-up" aria-hidden="true"></i></button>
        <label class="field"><span>ל-</span><select id="u-to"></select></label>
        <div class="result" id="u-res" aria-live="polite"></div>
      </div>
      <div class="card" id="u-height" style="margin-top:12px" hidden>
        <div class="note" style="margin-bottom:10px">גובה: רגל ואינץ\' וסנטימטרים</div>
        <div class="two">
          <label class="field"><span>רגל</span><input id="h-ft" type="text" inputmode="decimal" autocomplete="off"></label>
          <label class="field"><span>אינץ\'</span><input id="h-in" type="text" inputmode="decimal" autocomplete="off"></label>
        </div>
        <label class="field"><span>סנטימטרים</span><input id="h-cm" type="text" inputmode="decimal" autocomplete="off"></label>
      </div>`;

    const $ = (id) => container.querySelector(id);
    const selCat = $('#u-cat'), val = $('#u-val'), from = $('#u-from'), to = $('#u-to'), res = $('#u-res');
    const height = $('#u-height'), hFt = $('#h-ft'), hIn = $('#h-in'), hCm = $('#h-cm');

    function fillUnits() {
      const units = categories[cat].units;
      const ids = Object.keys(units);
      const d = DEFAULTS[cat] ?? [ids[0], ids[1] ?? ids[0]];
      const f = saved.cat === cat && units[saved.from] ? saved.from : d[0];
      const t = saved.cat === cat && units[saved.to] ? saved.to : d[1];
      from.innerHTML = options(units, f);
      to.innerHTML = options(units, t);
      height.hidden = cat !== 'length';
    }

    function update() {
      store.set(KEY, { cat, from: from.value, to: to.value });
      const v = parseNumber(val.value);
      if (v === null) { res.replaceChildren(); return; }
      const bdi = document.createElement('bdi');
      bdi.dir = 'ltr';
      bdi.textContent = fmt(convert(cat, v, from.value, to.value));
      res.replaceChildren(bdi, ' ', categories[cat].units[to.value].label);
    }

    selCat.addEventListener('change', () => { cat = selCat.value; fillUnits(); update(); });
    val.addEventListener('input', update);
    from.addEventListener('change', update);
    to.addEventListener('change', update);
    $('#u-swap').addEventListener('click', () => {
      const f = from.value;
      from.value = to.value;
      to.value = f;
      update();
    });

    function heightFromFeet() {
      const ft = parseNumber(hFt.value), inch = parseNumber(hIn.value);
      if (ft === null && inch === null) { hCm.value = ''; return; }
      hCm.value = fmt(Number(ftInToCm(ft ?? 0, inch ?? 0).toFixed(1)));
    }
    function heightFromCm() {
      const cm = parseNumber(hCm.value);
      if (cm === null) { hFt.value = ''; hIn.value = ''; return; }
      const r = cmToFtIn(cm);
      hFt.value = String(r.ft);
      hIn.value = String(r.inch);
    }
    hFt.addEventListener('input', heightFromFeet);
    hIn.addEventListener('input', heightFromFeet);
    hCm.addEventListener('input', heightFromCm);

    fillUnits();
    update();
  },
};
