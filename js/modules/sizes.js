import { mountTableView } from '../sizeView.js';

const IDS = ['women_clothes', 'men_suits', 'men_shirts', 'men_tshirts', 'women_shoes', 'men_shoes'];

export default {
  id: 'sizes',
  title: 'בגדים ונעליים',
  group: 'convert',
  icon: 't-shirt',
  render(container) {
    container.innerHTML = `
      <div class="card"><div id="s-view">טוען…</div></div>
      <div class="note" id="s-note" style="margin-top:10px"></div>`;
    fetch('data/sizes.json').then((r) => r.json()).then((d) => {
      mountTableView(container.querySelector('#s-view'), IDS.map((id) => d.tables.find((t) => t.id === id)), 'sizes_last');
      container.querySelector('#s-note').textContent = `${d.note_he} נבדק ב-${d.verifiedAt}. מקור: ויקיפדיה.`;
    }).catch(() => { container.querySelector('#s-view').textContent = 'טבלאות המידות אינן זמינות כרגע.'; });
  },
};
