// Service worker של מחשבון המרות אולטימטיבי.
// כל שחרור שמשנה קובץ באפליקציה חייב להעלות את CACHE_VERSION, אחרת מכשירים ימשיכו להציג את הגרסה הישנה.
const CACHE_VERSION = 'v2';
const CACHE = `converter-${CACHE_VERSION}`;

const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/currencyUi.js',
  'js/picker.js',
  'js/simpleConverter.js',
  'js/rates.js',
  'js/registry.js',
  'js/sizeView.js',
  'js/taxData.js',
  'js/ui.js',
  'js/lib/cards.js',
  'js/lib/dates.js',
  'js/lib/fuel.js',
  'js/lib/kitchen.js',
  'js/lib/money.js',
  'js/lib/num.js',
  'js/lib/percent.js',
  'js/lib/search.js',
  'js/lib/sizes.js',
  'js/lib/store.js',
  'js/lib/timezones.js',
  'js/lib/tip.js',
  'js/lib/unitprice.js',
  'js/lib/units.js',
  'js/lib/ustax.js',
  'js/modules/cardcost.js',
  'js/modules/currencies.js',
  'js/modules/dates.js',
  'js/modules/discounts.js',
  'js/modules/fuel.js',
  'js/modules/kitchen.js',
  'js/modules/percent.js',
  'js/modules/shopsizes.js',
  'js/modules/sizes.js',
  'js/modules/temperature.js',
  'js/modules/time.js',
  'js/modules/timezones.js',
  'js/modules/tip.js',
  'js/modules/unitprice.js',
  'js/modules/units.js',
  'js/modules/ustax.js',
  'js/modules/vat.js',
  'data/cards.json',
  'data/cities.json',
  'data/cooking.json',
  'data/rates-snapshot.json',
  'data/sizes.json',
  'data/tips.json',
  'data/us-sales-tax.json',
  'data/us-tax-rules.json',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'vendor/phosphor/Phosphor-Duotone.woff2',
  'vendor/phosphor/style.css',
];

self.addEventListener('install', (event) => {
  // בלי skipWaiting אוטומטי: גרסה חדשה מחכה עד שהמשתמשת מאשרת, כדי לא לרענן לה באמצע הקלדה.
  // cache: 'reload' עוקף את המטמון הרגיל של הדפדפן, כדי שעדכון לא ישמור קבצים ישנים.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((p) => new Request(p, { cache: 'reload' })))));
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('converter-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // בקשות לדומיין אחר (שערי מטבע) מטופלות באפליקציה עצמה, לא כאן.
  if (url.origin !== self.location.origin) return;

  if (url.pathname.includes('/data/')) {
    // נתונים: קודם הרשת (כדי לקבל תיקונים בלי התקנה מחדש), ואם אין קליטה, המטמון.
    event.respondWith(
      fetch(new Request(req, { cache: 'no-cache' }))
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req)),
    );
    return;
  }

  // קבצי האפליקציה: קודם המטמון.
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).catch(() => (req.mode === 'navigate' ? caches.match('index.html') : undefined))),
  );
});
