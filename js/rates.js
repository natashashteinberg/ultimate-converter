import { getRates } from './lib/money.js';
import { store } from './lib/store.js';

let pending = null;

// מחזיר את השערים (חי, שמור או מובנה). נטען פעם אחת לכל פתיחה של האפליקציה.
export function loadRates() {
  if (!pending) {
    pending = (async () => {
      const snapshot = await (await fetch('data/rates-snapshot.json')).json();
      return getRates({ fetch: (u) => fetch(u), store, now: Date.now, snapshot });
    })();
    pending.catch(() => { pending = null; });
  }
  return pending;
}

const SOURCE_LABEL = { live: 'עדכני', cache: 'שמור במכשיר', snapshot: 'מובנה באפליקציה, ייתכן שישן' };

export function rateNote(r) {
  const d = new Date(r.fetchedAt).toLocaleDateString('he-IL');
  return `שער מ-${d} (${SOURCE_LABEL[r.source] ?? r.source}). למידע בלבד, לא לביצוע עסקאות.`;
}
