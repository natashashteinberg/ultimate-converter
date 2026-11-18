import { gregorianToHebrew, hebrewMonthsOfYear, hebrewToGregorian, hebrewYearOf, daysBetween, countdownText, weeksAndDaysText, monthsAndDaysText } from '../lib/dates.js';
import { parseNumber } from '../lib/num.js';
import { store } from '../lib/store.js';
import { head, showLines } from '../ui.js';

const KEY = 'countdown';
const LONG = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };

function fromInput(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null;
}

function today() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12);
}

export default {
  id: 'dates',
  title: 'תאריכים',
  group: 'convert',
  icon: 'calendar-blank',
  render(container) {
    container.innerHTML = `
      <div class="card">
        ${head('כמה ימים עד לאירוע?', 'מזינים מה האירוע ומתי הוא, ורואים כמה ימים נשארו. למשל: טיסה ב-20 בדצמבר.')}
        <label class="field"><span>מה האירוע? (למשל: יום הולדת, טיסה)</span><input id="d-label" type="text" autocomplete="off"></label>
        <label class="field"><span>מתי האירוע?</span><input id="d-target" type="date"></label>
        <div class="result" id="d-count" aria-live="polite" style="font-size:22px"></div>
        <div class="note" id="d-count-date"></div>
      </div>
      <div class="card" style="margin-top:12px">
        ${head('המרת תאריך בין לועזי לעברי', 'בוחרים כיוון ומזינים תאריך, ורואים אותו בלוח השני. למשל: 3 באוקטובר 2024 הוא 1 בתשרי 5785.')}
        <div class="seg" role="radiogroup" aria-label="כיוון המרה">
          <label><input type="radio" name="dm" value="g2h" checked><span>לועזי לעברי</span></label>
          <label><input type="radio" name="dm" value="h2g"><span>עברי ללועזי</span></label>
        </div>
        <div id="d-g2h">
          <label class="field"><span>תאריך לועזי</span><input id="d-greg" type="date"></label>
        </div>
        <div id="d-h2g" hidden>
          <div class="two">
            <label class="field"><span>שנה עברית</span><input id="d-hyear" type="text" inputmode="numeric" autocomplete="off"></label>
            <label class="field"><span>יום בחודש</span><input id="d-hday" type="text" inputmode="numeric" autocomplete="off"></label>
          </div>
          <label class="field"><span>חודש</span><select id="d-hmonth"></select></label>
        </div>
        <div class="lines" id="d-conv" aria-live="polite"></div>
        <div class="note">התאריך העברי מתחלף בשקיעה, והחישוב כאן לפי חצות.</div>
      </div>
      <div class="card" style="margin-top:12px">
        ${head('כמה זמן עובר בין שני תאריכים?', 'מזינים תאריך התחלה ותאריך סיום, ורואים את ההפרש בימים, בשבועות ובחודשים. למשל: מ-3 בנובמבר עד 8 בדצמבר הם חודש ו-5 ימים.')}
        <div class="two">
          <label class="field"><span>מתאריך</span><input id="d-a" type="date"></label>
          <label class="field"><span>עד תאריך</span><input id="d-b" type="date"></label>
        </div>
        <div class="lines" id="d-between" aria-live="polite"></div>
      </div>`;

    const $ = (s) => container.querySelector(s);

    // ספירה לאחור
    const label = $('#d-label'), target = $('#d-target'), count = $('#d-count'), countDate = $('#d-count-date');
    const saved = store.get(KEY, { label: '', date: '' });
    label.value = saved.label;
    target.value = saved.date;
    function updateCount() {
      store.set(KEY, { label: label.value, date: target.value });
      const t = fromInput(target.value);
      if (!t) { count.textContent = ''; countDate.textContent = ''; return; }
      count.textContent = countdownText(label.value, daysBetween(today(), t));
      countDate.textContent = t.toLocaleDateString('he-IL', LONG);
    }
    label.addEventListener('input', updateCount);
    target.addEventListener('input', updateCount);
    updateCount();

    // המרה
    const radios = [...container.querySelectorAll('input[name="dm"]')];
    const g2h = $('#d-g2h'), h2g = $('#d-h2g'), conv = $('#d-conv');
    const greg = $('#d-greg'), hYear = $('#d-hyear'), hDay = $('#d-hday'), hMonth = $('#d-hmonth');
    hYear.value = String(hebrewYearOf(today()));

    function fillMonths() {
      const year = parseNumber(hYear.value);
      const previous = hMonth.value;
      if (!Number.isInteger(year) || year < 5000 || year > 6000) { hMonth.innerHTML = ''; return; }
      const months = hebrewMonthsOfYear(year);
      hMonth.innerHTML = months.map((m) => `<option value="${m.key}">${m.label}</option>`).join('');
      if (months.some((m) => m.key === previous)) hMonth.value = previous;
    }

    function convert() {
      const mode = radios.find((r) => r.checked).value;
      g2h.hidden = mode !== 'g2h';
      h2g.hidden = mode !== 'h2g';
      if (mode === 'g2h') {
        const d = fromInput(greg.value);
        if (!d) { conv.replaceChildren(); return; }
        showLines(conv, [['תאריך עברי', gregorianToHebrew(d)], ['יום בשבוע', d.toLocaleDateString('he-IL', { weekday: 'long' })]]);
      } else {
        const year = parseNumber(hYear.value), day = parseNumber(hDay.value);
        if (!Number.isInteger(year) || !Number.isInteger(day) || !hMonth.value) { conv.replaceChildren(); return; }
        const d = hebrewToGregorian(year, hMonth.value, day);
        if (!d) {
          conv.replaceChildren();
          const p = document.createElement('div');
          p.className = 'note';
          p.textContent = 'התאריך הזה לא קיים בחודש הזה.';
          conv.append(p);
          return;
        }
        showLines(conv, [['תאריך לועזי', d.toLocaleDateString('he-IL', LONG)]]);
      }
    }
    radios.forEach((r) => r.addEventListener('change', () => { fillMonths(); convert(); }));
    greg.addEventListener('input', convert);
    hYear.addEventListener('input', () => { fillMonths(); convert(); });
    hDay.addEventListener('input', convert);
    hMonth.addEventListener('change', convert);
    fillMonths();

    // ימים בין תאריכים
    const a = $('#d-a'), b = $('#d-b'), between = $('#d-between');
    function updateBetween() {
      const x = fromInput(a.value), y = fromInput(b.value);
      if (!x || !y) { between.replaceChildren(); return; }
      const n = Math.abs(daysBetween(x, y));
      showLines(between, [
        ['בימים', n === 1 ? 'יום אחד' : `${n} ימים`],
        ['בשבועות', weeksAndDaysText(n)],
        ['בחודשים ובשנים', monthsAndDaysText(x, y)],
      ]);
    }
    a.addEventListener('input', updateBetween);
    b.addEventListener('input', updateBetween);
  },
};
