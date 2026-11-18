import { lookupAll } from './lib/sizes.js';
import { store } from './lib/store.js';
import { showLines } from './ui.js';

const unique = (list) => [...new Set(list)];

// תצוגה משותפת לטבלאות מידות: בוחרים טבלה, מערכת ומידה, ורואים את כל המערכות האחרות.
export function mountTableView(root, tables, storeKey) {
  root.innerHTML = `
    <label class="field"><span>סוג</span><select class="sv-t"></select></label>
    <div class="two">
      <label class="field"><span>מערכת</span><select class="sv-s"></select></label>
      <label class="field"><span>מידה</span><select class="sv-v"></select></label>
    </div>
    <div class="sv-out"></div>`;

  const tSel = root.querySelector('.sv-t'), sSel = root.querySelector('.sv-s'), vSel = root.querySelector('.sv-v'), out = root.querySelector('.sv-out');
  const saved = store.get(storeKey, {});
  tSel.innerHTML = tables.map((t) => `<option value="${t.id}">${t.label_he}</option>`).join('');
  if (tables.some((t) => t.id === saved.t)) tSel.value = saved.t;
  // בשאילתה עם טבלה אחת אין מה לבחור, ולכן שדה "סוג" מוסתר.
  if (tables.length === 1) tSel.closest('label').hidden = true;

  const table = () => tables.find((t) => t.id === tSel.value);

  function fillSystems(preferred) {
    const t = table();
    sSel.innerHTML = t.systems.map((s) => `<option value="${s}">${t.system_labels[s]}</option>`).join('');
    if (t.systems.includes(preferred)) sSel.value = preferred;
  }

  function fillValues(preferred) {
    const t = table();
    const values = unique(t.rows.map((r) => String(r[sSel.value])));
    vSel.innerHTML = values.map((v) => `<option value="${v}">${v}</option>`).join('');
    if (values.includes(preferred)) vSel.value = preferred;
  }

  function update() {
    const t = table();
    store.set(storeKey, { t: t.id, s: sSel.value, v: vSel.value });
    const rows = lookupAll(t, sSel.value, vSel.value);
    out.replaceChildren(...rows.map((row, i) => {
      const box = document.createElement('div');
      box.className = 'sv-row';
      if (rows.length > 1) {
        const h = document.createElement('div');
        h.className = 'note';
        h.textContent = `אפשרות ${i + 1} מתוך ${rows.length}`;
        box.append(h);
      }
      const lines = document.createElement('div');
      lines.className = 'lines';
      showLines(lines, t.systems.map((s) => [t.system_labels[s], String(row[s])]));
      box.append(lines);
      return box;
    }));
  }

  tSel.addEventListener('change', () => { fillSystems(); fillValues(); update(); });
  sSel.addEventListener('change', () => { fillValues(); update(); });
  vSel.addEventListener('change', update);

  fillSystems(saved.t === tSel.value ? saved.s : undefined);
  fillValues(saved.t === tSel.value ? saved.v : undefined);
  update();
}
