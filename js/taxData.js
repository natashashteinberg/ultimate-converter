let pending = null;

// טוען את שיעורי המס וכללי הפטור (קבצי JSON באתר). נטען פעם אחת לכל פתיחה.
export function loadTaxData() {
  if (!pending) {
    pending = Promise.all([
      fetch('data/us-sales-tax.json').then((r) => r.json()),
      fetch('data/us-tax-rules.json').then((r) => r.json()),
    ]).then(([sales, rules]) => ({
      rates: sales.rates,
      rules: rules.rules,
      ratesVerifiedAt: sales.verifiedAt,
      rulesVerifiedAt: rules.verifiedAt,
    }));
    pending.catch(() => { pending = null; });
  }
  return pending;
}
