import { mountTableView } from '../sizeView.js';
import { head } from '../ui.js';

const HELP = 'בוחרים באיזו מערכת יש לך מידה (למשל ארה"ב), ואת המידה עצמה, ורואים את המידה המקבילה בשאר המערכות.';

// לכל שאילתה כותרת, הסבר קצר וטבלה אחת. הקבוצות מופרדות לנשים ולגברים.
const GROUPS = [
  {
    title: 'נשים',
    queries: [
      { id: 'women_clothes', title: 'בגדי נשים', help: 'שמלות, חליפות וחולצות. ' + HELP },
      { id: 'women_shoes', title: 'נעלי נשים', help: HELP },
      { id: 'bra', title: 'חזיות', help: 'מוצג רק היקף החזייה (המספר), כי גודל הכוסית (A, B, C) משתנה בין מדינות. ' + HELP },
    ],
  },
  {
    title: 'גברים',
    queries: [
      { id: 'men_suits', title: 'חליפות וז\'קטים', help: HELP },
      { id: 'men_shirts', title: 'חולצות מכופתרות', help: 'לפי היקף הצוואר. ' + HELP },
      { id: 'men_tshirts', title: 'חולצות טי וספורט', help: 'לפי אותיות (S, M, L) והיקף החזה. ' + HELP },
      { id: 'men_shoes', title: 'נעלי גברים', help: HELP },
    ],
  },
];

export default {
  id: 'sizes',
  title: 'בגדים ונעליים',
  group: 'convert',
  icon: 't-shirt',
  render(container) {
    container.innerHTML = `
      ${GROUPS.map((g) => `
        <section>
          <h2 class="group-big">${g.title}</h2>
          ${g.queries.map((q) => `<div class="card" id="s-${q.id}">${head(q.title, q.help)}<div class="s-mount">טוען…</div></div>`).join('')}
        </section>`).join('')}
      <div class="note" id="s-note" style="margin-top:24px"></div>`;
    fetch('data/sizes.json').then((r) => r.json()).then((d) => {
      for (const g of GROUPS) {
        for (const q of g.queries) {
          const mount = container.querySelector(`#s-${q.id} .s-mount`);
          mountTableView(mount, [d.tables.find((t) => t.id === q.id)], `sizes_${q.id}`);
        }
      }
      container.querySelector('#s-note').textContent = `${d.note_he} נבדק ב-${d.verifiedAt}. מקור: ויקיפדיה. מידות ילדים עדיין לא נכללו.`;
    }).catch(() => { container.querySelector('#s-note').textContent = 'טבלאות המידות אינן זמינות כרגע.'; });
  },
};
