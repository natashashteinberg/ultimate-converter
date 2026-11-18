const LITERS_PER_US_GALLON = 3.785411784;
const KM_PER_MILE = 1.609344;
const L100_TIMES_MPG = 100 * LITERS_PER_US_GALLON / KM_PER_MILE;

export function mpgToL100(mpg) {
  return mpg > 0 ? L100_TIMES_MPG / mpg : NaN;
}

export function l100ToMpg(l100) {
  return l100 > 0 ? L100_TIMES_MPG / l100 : NaN;
}

export function kmPerL(l100) {
  return l100 > 0 ? 100 / l100 : NaN;
}

export function pricePerLiterIls({ pricePerGallonUsd, usdToIls }) {
  return pricePerGallonUsd * usdToIls / LITERS_PER_US_GALLON;
}
