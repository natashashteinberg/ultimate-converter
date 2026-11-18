import { mpgToL100, l100ToMpg, kmPerL, pricePerLiterIls, pricePerGallonUsd } from '../lib/fuel.js';
import { convertCurrency } from '../lib/money.js';
import { loadRates } from '../rates.js';
import { head, readNum } from '../ui.js';

const show = (n, d = 2) => (Number.isFinite(n) ? String(Number(n.toFixed(d))) : '');

export default {
  id: 'fuel',
  title: 'דלק',
  group: 'travel',
  icon: 'gas-pump',
  render(container) {
    container.innerHTML = `
      <div class="card">
        ${head('צריכת דלק של רכב', 'בארה"ב מודדים צריכה במיילים לגלון, ובישראל בליטרים ל-100 ק"מ. מקלידים באחד השדות והשאר מתעדכנים. למשל: 30 מייל לגלון הם 7.84 ליטר ל-100 ק"מ.')}
        <label class="field"><span>מיילים לגלון (mpg)</span><input id="f-mpg" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 30"></label>
        <label class="field"><span>ליטרים ל-100 ק"מ</span><input id="f-l100" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 7.8"></label>
        <label class="field"><span>ק"מ לליטר</span><input id="f-kml" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 12.8"></label>
      </div>
      <div class="card">
        ${head('מחיר דלק: גלון בדולרים וליטר בשקלים', 'בארה"ב מחיר הדלק הוא לגלון בדולרים, ובישראל לליטר בשקלים. מקלידים באחד השדות והשני מתעדכן, לפי שער הדולר של היום. למשל: 3.50 דולר לגלון הם כ-3 שקלים לליטר.')}
        <label class="field"><span>מחיר לגלון (בדולרים)</span><input id="f-gal" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 3.50"></label>
        <label class="field"><span>מחיר לליטר (בשקלים)</span><input id="f-lit" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 7.50"></label>
        <div class="note" id="f-note"></div>
      </div>`;

    const $ = (s) => container.querySelector(s);
    const mpg = $('#f-mpg'), l100 = $('#f-l100'), kml = $('#f-kml'), gal = $('#f-gal'), lit = $('#f-lit');
    let usdToIls = null;

    function fromMpg() {
      const v = readNum(mpg);
      const l = v === null ? NaN : mpgToL100(v);
      l100.value = show(l);
      kml.value = show(kmPerL(l));
    }
    function fromL100() {
      const v = readNum(l100);
      mpg.value = show(v === null ? NaN : l100ToMpg(v));
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

    // מחיר: שני הכיוונים. כשהשער לא זמין, אין חישוב.
    gal.addEventListener('input', () => {
      const g = readNum(gal);
      lit.value = usdToIls && g !== null && g >= 0 ? show(pricePerLiterIls({ pricePerGallonUsd: g, usdToIls })) : '';
    });
    lit.addEventListener('input', () => {
      const l = readNum(lit);
      gal.value = usdToIls && l !== null && l >= 0 ? show(pricePerGallonUsd({ pricePerLiterIls: l, usdToIls })) : '';
    });

    loadRates().then((r) => {
      usdToIls = convertCurrency(1, 'USD', 'ILS', r.rates);
      $('#f-note').textContent = `לפי שער דולר של ${show(usdToIls, 3)} שקלים (מ-${new Date(r.fetchedAt).toLocaleDateString('he-IL')}).`;
      if (readNum(gal) !== null) gal.dispatchEvent(new Event('input'));
    }).catch(() => { $('#f-note').textContent = 'אין שער דולר זמין כרגע, ולכן אי אפשר לחשב מחיר.'; });
  },
};
