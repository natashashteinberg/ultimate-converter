const clean = (n) => Number(n.toPrecision(12));
const cents = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function addVat(net, ratePct) {
  const vat = cents(net * ratePct / 100);
  return { gross: cents(net + vat), vat };
}

export function removeVat(gross, ratePct) {
  const net = cents(gross / (1 + ratePct / 100));
  return { net, vat: cents(gross - net) };
}

export function percentOf(pct, base) {
  return clean(pct * base / 100);
}

export function whatPercent(part, whole) {
  return whole === 0 ? NaN : clean(part / whole * 100);
}

export function percentChange(from, to) {
  return from === 0 ? NaN : clean((to - from) / from * 100);
}

export function applyDiscounts(price, discountsPct) {
  if (price < 0 || discountsPct.some((d) => d < 0 || d > 100)) return { final: NaN, saved: NaN };
  const final = discountsPct.reduce((p, d) => p * (1 - d / 100), price);
  return { final: cents(final), saved: cents(price - final) };
}
