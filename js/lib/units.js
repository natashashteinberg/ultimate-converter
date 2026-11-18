const lin = (label, factor) => ({ label, factor });

export const categories = {
  length: {
    label: 'אורך',
    units: {
      mm: lin('מילימטר', 1), cm: lin('סנטימטר', 10), m: lin('מטר', 1000), km: lin('קילומטר', 1e6),
      in: lin('אינץ\'', 25.4), ft: lin('רגל', 304.8), yd: lin('יארד', 914.4), mi: lin('מייל', 1609344),
    },
  },
  weight: {
    label: 'משקל',
    units: {
      g: lin('גרם', 1), kg: lin('קילוגרם', 1000), oz: lin('אונקיה', 28.349523125), lb: lin('פאונד', 453.59237),
    },
  },
  volume: {
    label: 'נפח',
    units: {
      ml: lin('מיליליטר', 1), l: lin('ליטר', 1000), tsp: lin('כפית', 4.92892159375),
      tbsp: lin('כף', 14.78676478125), cup: lin('כוס אמריקאית', 236.5882365),
      fl_oz: lin('אונקיית נוזל', 29.5735295625), gal_us: lin('גלון אמריקאי', 3785.411784),
    },
  },
  area: {
    label: 'שטח',
    units: {
      cm2: lin('סמ"ר', 0.0001), m2: lin('מ"ר', 1), km2: lin('קמ"ר', 1e6), dunam: lin('דונם', 1000),
      ha: lin('הקטר', 10000), in2: lin('אינץ\' רבוע', 0.00064516), ft2: lin('רגל רבועה', 0.09290304),
      acre: lin('אקר', 4046.8564224),
    },
  },
  temperature: {
    label: 'טמפרטורה',
    units: {
      c: { label: 'צלזיוס', to: (v) => v + 273.15, from: (k) => k - 273.15 },
      f: { label: 'פרנהייט', to: (v) => (v - 32) * 5 / 9 + 273.15, from: (k) => (k - 273.15) * 9 / 5 + 32 },
      k: { label: 'קלווין', to: (v) => v, from: (k) => k },
    },
  },
  speed: {
    label: 'מהירות',
    units: { kmh: lin('קמ"ש', 1), mph: lin('מייל לשעה', 1.609344), ms: lin('מטר לשנייה', 3.6) },
  },
  time: {
    label: 'זמן',
    units: {
      s: lin('שניות', 1), min: lin('דקות', 60), h: lin('שעות', 3600), d: lin('ימים', 86400),
      wk: lin('שבועות', 604800), mo: lin('חודשים (ממוצע)', 2629800), yr: lin('שנים (ממוצע)', 31557600),
    },
  },
  data: {
    label: 'נתונים',
    units: { b: lin('בייט', 1), kb: lin('KB', 1e3), mb: lin('MB', 1e6), gb: lin('GB', 1e9), tb: lin('TB', 1e12) },
  },
  energy: {
    label: 'אנרגיה',
    units: { kj: lin('קילו-ג\'אול', 1000), kcal: lin('קילוקלוריה', 4184) },
  },
  pressure: {
    label: 'לחץ',
    units: { bar: lin('בר', 100000), psi: lin('PSI', 6894.757293168) },
  },
};

function unitOf(category, unit) {
  return categories[category]?.units[unit] ?? null;
}

export function toBase(category, unit, value) {
  const u = unitOf(category, unit);
  if (!u) return NaN;
  return u.to ? u.to(value) : value * u.factor;
}

function fromBase(category, unit, base) {
  const u = unitOf(category, unit);
  if (!u) return NaN;
  return u.from ? u.from(base) : base / u.factor;
}

export function convert(category, value, from, to) {
  const out = fromBase(category, to, toBase(category, from, value));
  return Number(out.toPrecision(12));
}

export function ftInToCm(ft, inch) {
  return convert('length', ft * 12 + inch, 'in', 'cm');
}

export function cmToFtIn(cm) {
  const totalIn = Math.round(convert('length', cm, 'cm', 'in') * 10) / 10;
  let ft = Math.floor(totalIn / 12);
  let inch = Math.round((totalIn - ft * 12) * 10) / 10;
  if (inch >= 12) { ft += 1; inch = 0; }
  return { ft, inch };
}
