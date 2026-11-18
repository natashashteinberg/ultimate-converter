import { filterItems } from './lib/search.js';

// בורר עם שדה חיפוש ורשימה פתוחה מתחתיו. מקלידים, הרשימה מסתננת, לוחצים על פריט כדי לבחור.
// items: [{ value, label, search?, group? }] בסדר התצוגה. פריטים עוקבים עם אותה group מקובצים תחת כותרת.
export function createPicker({ label, items, value, onChange, placeholder = 'חיפוש…', emptyLabel = '' }) {
  let all = items;
  let current = value;

  const root = document.createElement('div');
  root.className = 'field picker';

  const title = document.createElement('span');
  title.textContent = label;

  const selected = document.createElement('div');
  selected.className = 'pk-selected';
  selected.setAttribute('aria-live', 'polite');

  const input = document.createElement('input');
  input.type = 'text';
  input.setAttribute('inputmode', 'search');
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('aria-label', `${label}: חיפוש`);
  input.placeholder = placeholder;

  const list = document.createElement('div');
  list.className = 'pk-list';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', label);

  root.append(title, selected, input, list);

  const labelOf = (v) => all.find((i) => i.value === v)?.label ?? '';

  function showSelected() {
    selected.textContent = current === undefined ? emptyLabel : labelOf(current);
    selected.classList.toggle('empty', current === undefined);
  }

  function markSelected() {
    for (const b of list.querySelectorAll('.pk-opt')) {
      const on = b.dataset.value === String(current);
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
  }

  function renderList() {
    const shown = filterItems(all, input.value);
    const nodes = [];
    let lastGroup = null;
    for (const item of shown) {
      if (item.group && item.group !== lastGroup) {
        const h = document.createElement('div');
        h.className = 'pk-group';
        h.textContent = item.group;
        nodes.push(h);
      }
      lastGroup = item.group ?? null;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pk-opt';
      b.dataset.value = String(item.value);
      b.setAttribute('role', 'option');
      b.textContent = item.label;
      nodes.push(b);
    }
    if (shown.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'pk-empty';
      empty.textContent = 'לא נמצאו תוצאות';
      nodes.push(empty);
    }
    list.replaceChildren(...nodes);
    markSelected();
  }

  function scrollToSelected() {
    const on = list.querySelector('.pk-opt.on');
    if (on) list.scrollTop = Math.max(0, on.offsetTop - list.clientHeight / 2 + on.offsetHeight / 2 - list.offsetTop);
  }

  function choose(v, fire) {
    current = v;
    showSelected();
    markSelected();
    if (fire) onChange?.(v);
  }

  input.addEventListener('input', renderList);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); list.querySelector('.pk-opt')?.focus(); }
  });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('.pk-opt');
    if (!b) return;
    choose(b.dataset.value, true);
    // אחרי בחירה מנקים את החיפוש, כך שהרשימה המלאה חוזרת והפריט הנבחר מודגש.
    input.value = '';
    renderList();
    scrollToSelected();
  });
  list.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const opts = [...list.querySelectorAll('.pk-opt')];
    const i = opts.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    if (e.key === 'ArrowUp' && i === 0) input.focus();
    else opts[Math.min(opts.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))].focus();
  });

  renderList();
  showSelected();

  return {
    el: root,
    get value() { return current; },
    setValue(v) { choose(v, false); scrollToSelected(); },
    setItems(next) { all = next; showSelected(); renderList(); },
    scrollToSelected,
  };
}
