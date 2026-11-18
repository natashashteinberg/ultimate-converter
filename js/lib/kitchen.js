function gramsPerCup(id, data) {
  return data.ingredients.find((i) => i.id === id)?.gramsPerCup ?? NaN;
}

export function cupsToGrams(id, cups, data) {
  return cups >= 0 ? cups * gramsPerCup(id, data) : NaN;
}

export function gramsToCups(id, grams, data) {
  return grams >= 0 ? grams / gramsPerCup(id, data) : NaN;
}

export function sticksToGrams(sticks, data) {
  return sticks >= 0 ? sticks * data.butterStickG : NaN;
}

export function gramsToSticks(grams, data) {
  return grams >= 0 ? grams / data.butterStickG : NaN;
}
