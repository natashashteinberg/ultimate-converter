import { percentOf, whatPercent, percentChange } from '../lib/percent.js';
import { head, readNum, onInput, showLines } from '../ui.js';

const num = (n) => Number(n.toPrecision(10)).toLocaleString('en-US', { maximumFractionDigits: 4 });

export default {
  id: 'percent',
  title: 'אחוזים',
  group: 'money',
  icon: 'percent',
  render(container) {
    container.innerHTML = `
      <div class="card">
        ${head('כמה זה X אחוז מסכום?', 'מזינים אחוז וסכום, ורואים כמה זה. למשל: 15% מ-200 הם 30.')}
        <div class="two">
          <label class="field"><span>האחוז</span><input id="p1a" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 15"></label>
          <label class="field"><span>מתוך סכום</span><input id="p1b" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 200"></label>
        </div>
        <div class="lines" id="p1r" aria-live="polite"></div>
      </div>
      <div class="card">
        ${head('כמה אחוז זה מתוך סכום?', 'מזינים מספר קטן ומספר גדול, ורואים איזה אחוז הקטן הוא מהגדול. למשל: 25 הוא 12.5% מ-200.')}
        <div class="two">
          <label class="field"><span>המספר</span><input id="p2a" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 25"></label>
          <label class="field"><span>מתוך</span><input id="p2b" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 200"></label>
        </div>
        <div class="lines" id="p2r" aria-live="polite"></div>
      </div>
      <div class="card">
        ${head('בכמה אחוזים זה עלה או ירד?', 'מזינים את הערך הקודם ואת הערך החדש. למשל: מחיר שעלה מ-80 ל-100 עלה ב-25%.')}
        <div class="two">
          <label class="field"><span>הערך הקודם</span><input id="p3a" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 80"></label>
          <label class="field"><span>הערך החדש</span><input id="p3b" type="text" inputmode="decimal" autocomplete="off" placeholder="למשל 100"></label>
        </div>
        <div class="lines" id="p3r" aria-live="polite"></div>
      </div>`;

    const $ = (s) => container.querySelector(s);

    function pair(a, b, out, fn, label, suffix = '') {
      const calc = () => {
        const x = readNum(a), y = readNum(b);
        const v = x === null || y === null ? NaN : fn(x, y);
        if (!Number.isFinite(v)) { out.replaceChildren(); return; }
        showLines(out, [[label, num(v) + suffix]]);
      };
      onInput([a, b], calc);
    }
    pair($('#p1a'), $('#p1b'), $('#p1r'), percentOf, 'התוצאה');
    pair($('#p2a'), $('#p2b'), $('#p2r'), whatPercent, 'האחוז', '%');
    pair($('#p3a'), $('#p3b'), $('#p3r'), (from, to) => percentChange(from, to), 'השינוי', '%');
  },
};
