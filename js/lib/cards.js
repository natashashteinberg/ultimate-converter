import { realCostIls } from './money.js';
import { roundTo } from './num.js';

// משווה כמה אותה קנייה עולה בשקלים בכל כרטיס, מהזול ליקר. כרטיסים עם אותה עמלה נשארים בסדר המקורי.
export function compareCards({ amount, from, rates, cards, fixedFeeIls = 0 }) {
  if (!(amount >= 0) || !Number.isFinite(amount)) return [];
  const rows = cards
    .map((c, index) => ({ id: c.id, feePct: c.feePct, index, totalIls: realCostIls(amount, from, rates, c.feePct, fixedFeeIls) }))
    .filter((r) => Number.isFinite(r.totalIls))
    .sort((a, b) => a.totalIls - b.totalIls || a.index - b.index);
  if (rows.length === 0) return [];
  const cheapest = rows[0].totalIls;
  return rows.map(({ index, ...r }) => ({ ...r, extraIls: roundTo(r.totalIls - cheapest, 2) }));
}
