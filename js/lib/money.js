import { roundTo } from './num.js';

export const RATES_URL = 'https://open.er-api.com/v6/latest/USD';
const CACHE_KEY = 'rates_cache';
const FALLBACK_TTL_MS = 12 * 3600 * 1000;

const clean = (n) => Number(n.toPrecision(12));

async function fetchLive(fetchFn, now) {
  const res = await fetchFn(RATES_URL);
  if (!res.ok) throw new Error('rates http error');
  const json = await res.json();
  if (json.result !== 'success' || !json.rates) throw new Error('rates service error');
  const next = Number(json.time_next_update_unix) * 1000;
  return {
    base: 'USD',
    rates: json.rates,
    fetchedAt: now(),
    nextUpdateAt: Number.isFinite(next) ? next : now() + FALLBACK_TTL_MS,
    source: 'live',
  };
}

export async function getRates({ fetch: fetchFn, store, now, snapshot }) {
  const cached = store.get(CACHE_KEY, null);
  if (cached && now() < cached.nextUpdateAt) return { ...cached, source: 'cache' };
  try {
    const live = await fetchLive(fetchFn, now);
    store.set(CACHE_KEY, live);
    return live;
  } catch {
    if (cached) return { ...cached, source: 'cache' };
    return { ...snapshot, source: 'snapshot' };
  }
}

export function convertCurrency(amount, from, to, rates) {
  return clean(amount / rates[from] * rates[to]);
}

export function realCostIls(foreignAmount, from, rates, feePct, fixedFeeIls = 0) {
  const ils = convertCurrency(foreignAmount, from, 'ILS', rates);
  return roundTo(ils * (1 + feePct / 100) + fixedFeeIls, 2);
}
