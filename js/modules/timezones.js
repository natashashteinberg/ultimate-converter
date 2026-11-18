import { convertTime, wallTime } from '../lib/timezones.js';
import { store } from '../lib/store.js';
import { bdi } from '../ui.js';

const KEY = 'tz_state';
const DEFAULT_LIST = ['new_york', 'los_angeles', 'london'];

export default {
  id: 'timezones',
  title: 'אזורי זמן',
  group: 'convert',
  icon: 'globe-hemisphere-west',
  render(container) {
    container.innerHTML = `
      <div class="card">
        <label class="field"><span>עיר מקור</span><select id="z-base"></select></label>
        <div class="two">
          <label class="field"><span>תאריך</span><input id="z-date" type="date"></label>
          <label class="field"><span>שעה</span><input id="z-time" type="time"></label>
        </div>
        <button class="add" id="z-now" type="button" style="margin-top:0">עכשיו</button>
      </div>
      <div class="card" style="margin-top:12px">
        <div id="z-list"></div>
        <div class="note" id="z-empty" hidden>הוסיפי עיר כדי לראות את השעה בה.</div>
      </div>
      <div class="card" style="margin-top:12px">
        <label class="field"><span>חיפוש עיר להוספה</span><input id="z-q" type="text" autocomplete="off" placeholder="למשל מיאמי או Tokyo"></label>
        <label class="field"><span>עיר</span><select id="z-add"></select></label>
        <button class="add" id="z-addbtn" type="button" style="margin-top:0">הוסף עיר</button>
      </div>
      <div class="note" style="margin-top:10px">שעון קיץ מחושב אוטומטית לפי התאריך שנבחר.</div>`;

    const $ = (s) => container.querySelector(s);
    const base = $('#z-base'), dateIn = $('#z-date'), timeIn = $('#z-time'), list = $('#z-list'), empty = $('#z-empty');
    const q = $('#z-q'), addSel = $('#z-add');
    const saved = store.get(KEY, { base: 'jerusalem', list: DEFAULT_LIST });
    let cities = [], byId = new Map(), chosen = Array.isArray(saved.list) ? saved.list : DEFAULT_LIST;
    const outs = new Map();

    function setNow() {
      const city = byId.get(base.value);
      const w = wallTime(city.tz, new Date());
      dateIn.value = w.date;
      timeIn.value = w.time;
      update();
    }

    function persist() { store.set(KEY, { base: base.value, list: chosen }); }

    function update() {
      persist();
      const from = byId.get(base.value);
      for (const [id, o] of outs) {
        const to = byId.get(id);
        const r = convertTime({ fromTz: from.tz, toTz: to.tz, date: dateIn.value, time: timeIn.value });
        o.time.replaceChildren();
        o.day.textContent = '';
        if (!r) continue;
        o.time.append(bdi(r.time));
        const [, m, d] = r.date.split('-');
        const label = r.dayOffset < 0 ? 'אתמול' : r.dayOffset > 0 ? 'מחר' : 'אותו יום';
        o.day.textContent = `${label}, ${Number(d)}/${Number(m)}`;
      }
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
        del.addEventListener('click', () => { chosen = chosen.filter((x) => x !== id); renderList(); update(); });
        const mid = document.createElement('div');
        mid.append(name, day);
        row.append(mid, time, del);
        outs.set(id, { time, day });
        return row;
      }));
      empty.hidden = outs.size > 0;
    }

    function fillAdd() {
      const query = q.value.trim().toLowerCase();
      addSel.innerHTML = cities
        .filter((c) => !chosen.includes(c.id) && (!query || c.he.includes(query) || c.en.toLowerCase().includes(query)))
        .map((c) => `<option value="${c.id}">${c.he} · ${c.en}</option>`).join('');
    }

    base.addEventListener('change', update);
    dateIn.addEventListener('input', update);
    timeIn.addEventListener('input', update);
    $('#z-now').addEventListener('click', setNow);
    q.addEventListener('input', fillAdd);
    $('#z-addbtn').addEventListener('click', () => {
      if (!addSel.value) return;
      chosen = [...chosen, addSel.value];
      q.value = '';
      renderList();
      fillAdd();
      update();
    });

    fetch('data/cities.json').then((r) => r.json()).then((data) => {
      cities = data;
      byId = new Map(data.map((c) => [c.id, c]));
      base.innerHTML = data.map((c) => `<option value="${c.id}">${c.he}</option>`).join('');
      base.value = byId.has(saved.base) ? saved.base : 'jerusalem';
      renderList();
      fillAdd();
      setNow();
    }).catch(() => { list.textContent = 'רשימת הערים אינה זמינה כרגע.'; });
  },
};
