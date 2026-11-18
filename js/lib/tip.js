const toCents = (n) => Math.round(n * 100);

export function splitCents(totalCents, people) {
  if (!Number.isInteger(people) || people < 1) return [];
  const base = Math.floor(totalCents / people);
  const extra = totalCents - base * people;
  return Array.from({ length: people }, (_, i) => base + (i < extra ? 1 : 0));
}

export function calcTip({ bill, tax, basis, pct, people }) {
  if (bill < 0 || tax < 0 || pct < 0) return { tip: NaN, total: NaN, perPerson: [] };
  const billC = toCents(bill);
  const taxC = toCents(tax);
  const baseC = basis === 'post' ? billC + taxC : billC;
  const tipC = Math.round(baseC * pct / 100);
  const totalC = billC + taxC + tipC;
  return {
    tip: tipC / 100,
    total: totalC / 100,
    perPerson: splitCents(totalC, people).map((c) => c / 100),
  };
}
