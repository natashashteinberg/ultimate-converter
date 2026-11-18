const cents = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function categoriesFor(state, data) {
  const rules = data.rules[state] ?? [];
  return ['general', ...new Set(rules.map((r) => r.category))];
}

export function taxFor({ price, state, category, rateOverridePct }, data) {
  const override = Number.isFinite(rateOverridePct) && rateOverridePct >= 0 ? rateOverridePct : null;
  const stateRate = data.rates[state];

  let ratePct = override ?? stateRate?.combinedPct ?? 0;
  let note = null;
  if (!stateRate && override === null) note = 'המדינה לא נמצאה בטבלה, לכן לא חושב מס. אפשר להזין שיעור ידני.';

  if (!(price > 0)) return { tax: 0, total: 0, ratePct, exempt: false, note_he: note };

  const rule = (data.rules[state] ?? []).find((r) => r.category === category);
  let taxable = price;
  if (rule) {
    note = rule.note_he;
    if (rule.type === 'exempt') taxable = 0;
    else if (rule.type === 'below_threshold') taxable = price < rule.threshold ? 0 : price;
    else if (rule.type === 'first_amount') taxable = Math.max(0, price - rule.amount);
  }

  const tax = cents(taxable * ratePct / 100);
  return {
    tax,
    total: cents(price + tax),
    ratePct,
    exempt: Boolean(rule) && taxable === 0,
    note_he: note,
  };
}
