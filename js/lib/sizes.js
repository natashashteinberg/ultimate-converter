import { convert } from './units.js';

const norm = (v) => String(v).trim().replace(',', '.');

export function lookupAll(table, fromSystem, value) {
  const v = norm(value);
  return table.rows.filter((r) => r[fromSystem] !== undefined && norm(r[fromSystem]) === v);
}

export function lookup(table, fromSystem, value) {
  return lookupAll(table, fromSystem, value)[0] ?? null;
}

export function systemValues(table, system) {
  return table.rows.map((r) => String(r[system]));
}

// מסך 16:9: האלכסון הוא שורש של 16 בריבוע ועוד 9 בריבוע, כלומר בערך 18.3576 יחידות.
const DIAGONAL_16_9 = Math.sqrt(16 * 16 + 9 * 9);

export function tvDimensions(diagonalInches) {
  if (!(diagonalInches > 0)) return { wCm: NaN, hCm: NaN };
  const unit = diagonalInches / DIAGONAL_16_9;
  return {
    wCm: convert('length', 16 * unit, 'in', 'cm'),
    hCm: convert('length', 9 * unit, 'in', 'cm'),
  };
}
