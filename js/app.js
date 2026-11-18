import { tools, groups } from './registry.js';

const root = document.getElementById('app');
const APP_TITLE = 'מחשבון המרות אולטימטיבי';

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

function icon(name) {
  return el('i', { class: `ph-duotone ph-${name}`, 'aria-hidden': 'true' });
}

function renderHome() {
  document.title = APP_TITLE;
  root.replaceChildren(
    el('div', { class: 'top' },
      el('div', { class: 'hint' }, 'מה ממירים היום?'),
      el('h1', {}, APP_TITLE)),
  );

  for (const t of tools.filter((x) => x.group === 'main')) {
    root.append(
      el('a', { class: 'featured', href: `#/${t.id}` },
        icon(t.icon),
        el('div', { class: 'grow' }, el('div', { class: 't' }, t.title), t.subtitle ? el('div', { class: 's' }, t.subtitle) : ''),
        icon('arrow-left')),
    );
  }

  for (const g of groups) {
    const items = tools.filter((x) => x.group === g.id);
    if (!items.length) continue;
    root.append(
      el('div', { class: 'group-title' }, g.title),
      el('div', { class: 'grid' },
        ...items.map((t) => el('a', { class: 'tile', href: `#/${t.id}` }, icon(t.icon), el('div', {}, t.title)))),
    );
  }
}

function renderTool(tool) {
  document.title = `${tool.title} | ${APP_TITLE}`;
  const body = el('div');
  root.replaceChildren(
    el('div', { class: 'tool-head' },
      el('a', { class: 'back', href: '#/', 'aria-label': 'חזרה' }, icon('arrow-right')),
      el('h1', {}, tool.title)),
    body,
  );
  tool.render(body);
}

function route() {
  const id = location.hash.replace(/^#\/?/, '');
  const tool = tools.find((t) => t.id === id);
  if (tool) renderTool(tool);
  else renderHome();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();

// התקנה ואופליין: רק ב-HTTPS או ב-localhost.
function showUpdateBanner(reg) {
  if (document.getElementById('update-banner')) return;
  const bar = el('div', { id: 'update-banner', role: 'status' }, 'גרסה חדשה זמינה. ');
  const btn = el('button', { type: 'button' }, 'רענני');
  btn.addEventListener('click', () => reg.waiting?.postMessage('SKIP_WAITING'));
  bar.append(btn);
  document.body.append(bar);
}

const canRegister = 'serviceWorker' in navigator
  && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname));
if (canRegister) {
  navigator.serviceWorker.register('sw.js').then((reg) => {
    if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg);
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner(reg);
      });
    });
  }).catch(() => { /* האפליקציה עובדת גם בלי service worker */ });
  // בביקור הראשון ה-service worker רק משתלט על העמוד, ואין סיבה לרענן. מרעננים רק בעדכון, כשכבר היה שליטה.
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    location.reload();
  });
}
