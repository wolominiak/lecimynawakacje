// Oferty na okazje (sylwester, walentynki) do wyszukiwarek na /sylwester/ i /walentynki/.
// API widgetu wakacje.pl nie filtruje dat i zwraca najtańsze oferty, więc każdy kraj skanujemy
// w wąskich przedziałach cen (minPrice/maxPrice). Każdy przedział daje inne 100 ofert,
// a z całej puli zostawiamy te, których pobyt obejmuje dzień okazji.
// Wynik: public/occasions/<slug>.json
import fs from 'node:fs';

const API = 'https://widget.wakacje.pl/v2/api/widgets/offers';
const ids = JSON.parse(fs.readFileSync('data/wakacje-ids.json', 'utf8')).countries;

const OCCASIONS = [
  { slug: 'sylwester', until: '2027-01-01', match: (o) => o.departureDate <= '2026-12-31' && o.returnDate >= '2027-01-01' },
  { slug: 'walentynki', until: '2027-02-14', match: (o) => o.departureDate <= '2027-02-14' && o.returnDate >= '2027-02-14' },
];
const COUNTRIES = [
  'egipt', 'hiszpania', 'zjednoczone-emiraty-arabskie', 'portugalia', 'tanzania', 'tajlandia', 'dominikana', 'meksyk',
  'malediwy', 'sri-lanka', 'mauritius', 'seszele', 'cypr', 'malta', 'maroko', 'tunezja', 'oman', 'kenia', 'wietnam',
  'wyspy-zielonego-przyladka', 'jordania', 'turcja', 'grecja', 'wlochy', 'francja', 'czechy', 'austria', 'wegry',
  'niemcy', 'wielka-brytania', 'holandia', 'indonezja', 'kuba', 'jamajka',
];
// gęściej w typowych cenach, rzadziej w drogich
const BANDS = [];
for (let p = 800; p < 6000; p += 250) BANDS.push([p, p + 250]);
for (let p = 6000; p < 16000; p += 500) BANDS.push([p, p + 500]);
BANDS.push([16000, 60000]);

const KEEP = ['hotelId', 'transport', 'id', 'name', 'price', 'priceOld', 'priceDiscount', 'duration', 'departureDate', 'returnDate', 'category', 'departure', 'service', 'placeName', 'photo', 'tourOperatorName', 'ratingValue', 'ratingRecommends', 'url'];
const clean = (s) => (typeof s === 'string' ? s.replace(/[–—]/g, '-') : s);
const slim = (o) => Object.fromEntries(KEEP.filter((k) => o[k] != null).map((k) => [k, k === 'name' ? clean(o[k]) : k === 'placeName' ? o[k].map(clean) : o[k]]));

async function q(terms) {
  for (let i = 0; i < 3; i++) {
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
      const r = await fetch(API, { method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ terms: { regions: [], cities: [], countries: [], limit: 100, ...terms } }) });
      clearTimeout(t);
      const j = await r.json();
      return Array.isArray(j.data) ? j.data : [];
    } catch { await new Promise((r) => setTimeout(r, 800 * (i + 1))); }
  }
  return [];
}

const today = new Date().toISOString().slice(0, 10);
const active = OCCASIONS.filter((o) => today <= o.until);
if (!active.length) { console.log('Brak trwających okazji'); process.exit(0); }

const jobs = [];
for (const c of COUNTRIES) { if (ids[c]) for (const b of BANDS) jobs.push([c, b]); else console.log('Brak ID kraju', c); }
const found = Object.fromEntries(active.map((o) => [o.slug, new Map()]));
let done = 0;
const t0 = Date.now();
await Promise.all(Array.from({ length: 10 }, async () => {
  while (jobs.length) {
    const [c, [a, b]] = jobs.shift();
    const list = await q({ countries: [ids[c]], minPrice: a, maxPrice: b });
    for (const o of list) {
      if (!o.departureDate || o.departureDate < today || o.placeName?.[0] === 'Polska' || (o.transport && o.transport.value !== 1)) continue;
      for (const oc of active) if (oc.match(o)) found[oc.slug].set(o.id, slim(o));
    }
    if (++done % 100 === 0) console.log(`${done} zapytań, ${Math.round((Date.now() - t0) / 1000)} s`, Object.fromEntries(active.map((o) => [o.slug, found[o.slug].size])));
  }
}));

fs.mkdirSync('public/occasions', { recursive: true });
for (const oc of active) {
  const offers = [...found[oc.slug].values()].sort((x, y) => Number(String(x.price).replace(/\s/g, '')) - Number(String(y.price).replace(/\s/g, '')));
  const file = `public/occasions/${oc.slug}.json`;
  // gdy skan się nie udał (np. API niedostępne), nie nadpisujemy dobrych danych
  const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).offers?.length || 0 : 0;
  if (offers.length < Math.min(30, prev / 3)) { console.log(`${oc.slug}: tylko ${offers.length} ofert (było ${prev}), zostawiam stare dane`); continue; }
  fs.writeFileSync(file, JSON.stringify({ updated: new Date().toISOString(), offers }));
  console.log(`${oc.slug}: ${offers.length} ofert`);
}
