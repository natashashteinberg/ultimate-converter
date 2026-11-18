// מנרמל טקסט לחיפוש: אותיות קטנות, בלי גרשיים ומירכאות (כדי ש"גורגיה" ימצא את "ג'ורג'יה"), ורווחים בודדים.
const normalize = (s) => String(s).toLowerCase().replace(/['"`’׳״]/g, '').replace(/\s+/g, ' ').trim();

export function filterItems(items, query) {
  const q = normalize(query);
  if (!q) return items;
  return items.filter((i) => normalize(`${i.label} ${i.search ?? ''}`).includes(q));
}
