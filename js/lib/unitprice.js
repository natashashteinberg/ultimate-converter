import { categories, toBase } from './units.js';

function dimensionOf(unit) {
  if (unit === 'each') return { dim: 'each', base: 'each' };
  if (categories.weight.units[unit]) return { dim: 'weight', base: 'g' };
  if (categories.volume.units[unit]) return { dim: 'volume', base: 'ml' };
  return null;
}

export function compareUnitPrice(items) {
  if (items.length === 0) return { baseUnit: null, perBase: [], cheapestIndex: -1 };
  const dims = items.map((i) => dimensionOf(i.unit));
  if (dims.some((d) => d === null) || new Set(dims.map((d) => d.dim)).size > 1) return { error: 'mixed' };

  const perBase = items.map((i, idx) => {
    const qty = dims[idx].dim === 'each' ? i.qty : toBase(dims[idx].dim, i.unit, i.qty);
    return i.price >= 0 && qty > 0 ? i.price / qty : NaN;
  });

  let cheapestIndex = -1;
  perBase.forEach((p, idx) => {
    if (Number.isFinite(p) && (cheapestIndex === -1 || p < perBase[cheapestIndex])) cheapestIndex = idx;
  });
  return { baseUnit: dims[0].base, perBase, cheapestIndex };
}
