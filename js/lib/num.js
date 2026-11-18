const NUMBER_RE = /^-?(\d+(\.\d*)?|\.\d+)$/;

export function parseNumber(input) {
  if (typeof input !== 'string') return null;
  const cleaned = input.replace(/\s+/g, '').replace(',', '.');
  if (!NUMBER_RE.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function roundTo(n, digits) {
  const f = 10 ** digits;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export function formatMoney(n, digits = 2) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
