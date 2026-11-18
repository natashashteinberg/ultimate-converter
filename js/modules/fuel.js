import { mpgToL100, l100ToMpg, kmPerL, pricePerLiterIls } from '../lib/fuel.js';
import { convertCurrency } from '../lib/money.js';
import { formatMoney } from '../lib/num.js';
import { loadRates } from '../rates.js';
import { readNum, onInput, showLines } from '../ui.js';

const show = (n) => (Number.isFinite(n) ? String(Number(n.toFixed(2))) : '');

export default {
  id: 'fuel',
  title: 'דלק',
  group: 'travel',
  icon: 'gas-pump',
  render(container) {
    container.innerHTML = `
      <div class="card">
        <div class="note" style="margin-bottom:10px">צריכת דלק (גלון אמריקאי ומייל)</div>
        <label class="field"><span>מייל לגלון (mpg)</span><input id="f-mpg" type="text" inputmode="decimal" autocomplete="off" placeholder="30"></label>
        <label class="field"><span>ליטרים ל-100 ק"מ</span><input id="f-l100" type="text" inputmode="decimal" autocomplete="off"></label>
        <label class="field"><span>ק"מ לליטר</span><input id="f-kml" type="text" inputmode="decimal" autocomplete="off"></label>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="note" style="margin-bottom:10px">מחיר דלק: מגלון בדולרים לליטר בשקלים</div>
        <label class="field"><span>מחיר לגלון ($)</span><input id="f-gal" type="text" inputmode="decimal" autocomplete="off" placeholder="3.50"></label>
        <div class="lines" id="f-res" aria-live="polite"></div>
        <div class="note" id="f-note"></div>
      </div>`;

    const $ = (s) => container.querySelector(s);
    const mpg = $('#f-mpg'), l100 = $('#f-l100'), kml = $('#f-kml'), gal = $('#f-gal'), res = $('#f-res');
    let rates = null;

    function fromMpg() {
      const v = readNum(mpg);
      const l = v === null ? NaN : mpgToL100(v);
      l100.value = show(l);
      kml.value = show(kmPerL(l));
    }
    function fromL100() {
      const v = readNum(l100);
      const m = v === null ? NaN : l100ToMpg(v);
      mpg.value = show(m);
      kml.value = v === null ? '' : show(kmPerL(v));
    }
    function fromKml() {
      const v = readNum(kml);
      const l = v !== null && v > 0 ? 100 / v : NaN;
      l100.value = show(l);
      mpg.value = show(l100ToMpg(l));
    }
    mpg.addEventListener('input', fromMpg);
    l100.addEventListener('input', fromL100);
    kml.addEventListener('input', fromKml);

    function price() {
      const g = readNum(gal);
      if (g === null || g < 0 || !rates) { res.replaceChildren(); return; }
      const usdToIls = convertCurrency(1, 'USD', 'ILS', rates.rates);
      const perLiter = pricePerLiterIls({ pricePerGallonUsd: g, usdToIls });
      showLines(res, [['לליטר בשקלים', `₪${formatMoney(perLiter)}`], ['לליטר בדולרים', `$${formatMoney(g / 3.785411784)}`]]);
    }
    onInput([gal], price);

    loadRates().then((r) => {
      rates = r;
      $('#f-note').textContent = `לפי שער דולר מ-${new Date(r.fetchedAt).toLocaleDateString('he-IL')}.`;
      price();
    }).catch(() => { $('#f-note').textContent = 'אין שער דולר זמין כרגע.'; });
  },
};
