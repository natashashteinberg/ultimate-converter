import { convertTime, wallTime } from '../lib/timezones.js';
import { store } from '../lib/store.js';
import { createPicker } from '../picker.js';
import { head, bdi } from '../ui.js';

const KEY = 'tz_state2';
const DEFAULT_LIST = ['london', 'paris', 'tokyo'];

function dayLabel(r) {
  const [, m, d] = r.date.split('-');
  const word = r.dayOffset < 0 ? 'אתמול' : r.dayOffset > 0 ? 'מחר' : 'אותו יום';
  return `${word}, ${Number(d)}/${Number(m)}`;
}

export default {
  id: 'timezones',
  title: 'אזורי זמן',
  group: 'convert',
  icon: 'globe-hemisphere-west',
  render(container) {
    container.innerHTML = `
      <div class="card">
        ${head('איזו שעה זו בעיר אחרת?', 'בוחרים עיר מקור ועיר יעד, ושעה בעיר המקור, ורואים מה השעה באותו רגע בעיר היעד. אם משנים את השעה, כפתור "חזרה להווה" מחזיר לשעה הנוכחית. שעון קיץ מחושב אוטומטית.')}
        <div id="z-from-pick"></div>
        <div id="z-to-pick"></div>
        <div class="two">
          <label class="field"><span>תאריך בעיר המקור</span><input id="z-date" type="date"></label>
          <label class="field"><span>שעה בעיר המקור</span><input id="z-time" type="time"></label>
        </div>
        <button class="add" id="z-now" type="button" style="margin-top:0">חזרה להווה</button>
        <div class="result" id="z-main" aria-live="polite" style="margin-top:14px"></div>
        <div class="note" id="z-main-day"></div>
      </div>
      <div class="card">
        ${head('עוד ערים', 'רשימה של ערים עם השעה בכל אחת, לאותו רגע בעיר המקור. אפשר להוסיף עיר (עם חיפוש) ולהסיר עיר עם הכפתור ×.')}
        <div id="z-list"></div>
        <div class="note" id="z-empty" hidden>הוסיפי עיר כדי לראות את השעה בה.</div>
        <div id="z-add-pick" style="margin-top:14px"></div>
        <button class="add" id="z-addbtn" type="button" style="margin-top:0">הוסף עיר</button>
      </div>`;

    const $ = (s) => container.querySelector(s);
    const dateIn = $('#z-date'), timeIn = $('#z-time'), list = $('#z-list'), empty = $('#z-empty');
    const nowBtn = $('#z-now'), mainOut = $('#z-main'), mainDay = $('#z-main-day');
    const saved = store.get(KEY, { from: 'jerusalem', to: 'new_york', list: DEFAULT_LIST });
    let cities = [], byId = new Map();
    let fromId = saved.from, toId = saved.to, chosen = Array.isArray(saved.list) ? saved.list : DEFAULT_LIST;
    let live = true, fromPicker = null, toPicker = null, addPicker = null;
    const outs = new Map();

    const tzOf = (id) => byId.get(id).tz;
    const nowWall = () => wallTime(tzOf(fromId), new Date());

    function refreshNowButton() {
      const w = nowWall();
      nowBtn.disabled = dateIn.value === w.date && timeIn.value === w.time;
    }

    function setNow() {
      const w = nowWall();
      dateIn.value = w.date;
      timeIn.value = w.time;
      live = true;
      update();
    }

    function update() {
      store.set(KEY, { from: fromId, to: toId, list: chosen });
      const base = { fromTz: tzOf(fromId), date: dateIn.value, time: timeIn.value };
      const main = convertTime({ ...base, toTz: tzOf(toId) });
      mainOut.replaceChildren();
      mainDay.textContent = '';
      if (main) {
        mainOut.append(`ב${byId.get(toId).he}: `, bdi(main.time));
        mainDay.textContent = dayLabel(main);
      }
      for (const [id, o] of outs) {
        const r = convertTime({ ...base, toTz: tzOf(id) });
        o.time.replaceChildren();
        o.day.textContent = '';
        if (!r) continue;
        o.time.append(bdi(r.time));
        o.day.textContent = dayLabel(r);
      }
      refreshNowButton();
    }

    function addItems() {
      return cities
        .filter((c) => !chosen.includes(c.id))
        .map((c) => ({ value: c.id, label: `${c.he} · ${c.en}`, search: c.en }));
    }

    function renderList() {
      outs.clear();
      list.replaceChildren(...chosen.filter((id) => byId.has(id)).map((id) => {
        const row = document.createElement('div');
        row.className = 'tz-row';
        const name = document.createElement('div');
        name.className = 'tz-name';
        name.textContent = byId.get(id).he;
        const time = document.createElement('div');
        time.className = 'tz-time';
        const day = document.createElement('div');
        day.className = 'note tz-day';
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'tz-del';
        del.setAttribute('aria-label', `הסרת ${byId.get(id).he}`);
        del.textContent = '×';
        del.addEventListener('click', () => {
          chosen = chosen.filter((x) => x !== id);
          renderList();
          addPicker?.setItems(addItems());
          update();
        });
        const mid = document.createElement('div');
        mid.append(name, day);
        row.append(mid, time, del);
        outs.set(id, { time, day });
        return row;
      }));
      empty.hidden = outs.size > 0;
    }

    function userEdited() { live = false; update(); }
    dateIn.addEventListener('input', userEdited);
    timeIn.addEventListener('input', userEdited);
    nowBtn.addEventListener('click', setNow);
    $('#z-addbtn').addEventListener('click', () => {
      const id = addPicker?.value;
      if (!id || chosen.includes(id)) return;
      chosen = [...chosen, id];
      renderList();
      addPicker.setItems(addItems());
      addPicker.setValue(undefined);
      update();
    });

    // כשהשעה היא שעת ההווה, היא ממשיכה להתקדם. אחרת רק מתעדכן מצב הכפתור.
    const timer = setInterval(() => {
      if (!container.isConnected) { clearInterval(timer); return; }
      if (cities.length === 0) return;
      if (live) setNow(); else refreshNowButton();
    }, 15000);

    fetch('data/cities.json').then((r) => r.json()).then((data) => {
      cities = data;
      byId = new Map(data.map((c) => [c.id, c]));
      if (!byId.has(fromId)) fromId = 'jerusalem';
      if (!byId.has(toId)) toId = 'new_york';
      const items = data.map((c) => ({ value: c.id, label: `${c.he} · ${c.en}`, search: c.en }));
      fromPicker = createPicker({
        label: 'עיר המקור', items, value: fromId, placeholder: 'חיפוש עיר',
        onChange: (id) => { fromId = id; if (live) setNow(); else update(); },
      });
      toPicker = createPicker({
        label: 'עיר היעד', items, value: toId, placeholder: 'חיפוש עיר',
        onChange: (id) => { toId = id; update(); },
      });
      $('#z-from-pick').append(fromPicker.el);
      $('#z-to-pick').append(toPicker.el);
      fromPicker.scrollToSelected();
      toPicker.scrollToSelected();
      renderList();
      addPicker = createPicker({
        label: 'הוספת עיר לרשימה', items: addItems(), value: undefined, emptyLabel: 'בחרי עיר מהרשימה',
        placeholder: 'חיפוש עיר, למשל מיאמי או Tokyo',
      });
      $('#z-add-pick').append(addPicker.el);
      setNow();
    }).catch(() => { list.textContent = 'רשימת הערים אינה זמינה כרגע.'; });
  },
};
