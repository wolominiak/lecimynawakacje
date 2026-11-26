// Ceny lotów z Polski (Aviasales Data API, Travelpayouts). Uruchamiane codziennie w GitHub Actions.
// Wymaga TRAVELPAYOUTS_TOKEN. Wynik: data/flights.json (najtańsze loty i ceny w miesiącach dla tras).
import fs from 'fs';
import path from 'path';

const TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
if (!TOKEN) { console.error('Brak TRAVELPAYOUTS_TOKEN'); process.exit(1); }

const API = 'https://api.travelpayouts.com';
const ORIGINS = [
  ['WAW', 'Warszawa', 'warszawa', 'z Warszawy'], ['KRK', 'Kraków', 'krakow', 'z Krakowa'], ['KTW', 'Katowice', 'katowice', 'z Katowic'],
  ['GDN', 'Gdańsk', 'gdansk', 'z Gdańska'], ['WRO', 'Wrocław', 'wroclaw', 'z Wrocławia'], ['POZ', 'Poznań', 'poznan', 'z Poznania'],
];
const MAX_ROUTES = Number(process.env.MAX_ROUTES || 900);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(p, params) {
  const q = new URLSearchParams({ currency: 'pln', market: 'pl', ...params });
  for (let i = 0; i < 5; i++) {
    const r = await fetch(`${API}${p}?${q}`, { headers: { 'X-Access-Token': TOKEN, 'Accept-Encoding': 'gzip, deflate' } });
    if (r.status === 429) { await sleep(5000 * (i + 1)); continue; }
    if (!r.ok) { console.warn(p, params.origin, params.destination || '', r.status); return null; }
    const j = await r.json();
    if (j.success === false) { console.warn(p, j.error); return null; }
    return j.data;
  }
  return null;
}

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// 1. Lotnisko -> miasto (MXP -> MIL)
const airports = await fetch(`${API}/data/en/airports.json`).then((r) => r.json());
const cityOf = new Map(airports.map((a) => [a.code, a.city_code || a.code]));

// 2. Kierunki z przewodników: pole "airport" regionów, np. "Heraklion (HER) lub Chania (CHQ)"
const dests = new Map(); // kod miasta -> { d, name, country, region }
const dir = 'content/countries';
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
  const c = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const slug = c.slug || f.replace(/\.json$/, '');
  for (const r of c.regions || []) {
    for (const m of (r.airport || '').matchAll(/([^,();]+?)\s*\(([A-Z]{3})\)/g)) {
      const city = cityOf.get(m[2]) || m[2];
      if (city === 'WAW' || dests.has(city)) continue;
      let label = m[1].replace(/^(lub|i|oraz)\s+/i, '').replace(/^lotnisko\s+/i, '').trim();
      if (/airport|international|lotnisko|port lotniczy/i.test(label) || label.length > 28) label = r.name;
      dests.set(city, { d: city, name: label, country: slug, region: r.slug });
    }
  }
}
console.log('Kierunki z przewodników:', dests.size);

// 3. Najtańszy lot z każdego lotniska do wszystkich kierunków (jedno zapytanie na lotnisko)
const routes = {};
for (const [o, oName, oSlug, oFrom] of ORIGINS) {
  const list = (await get('/aviasales/v3/prices_for_dates', { origin: o, unique: 'true', sorting: 'price', limit: '1000', one_way: 'false' })) || [];
  let n = 0;
  for (const t of list) {
    const ds = dests.get(t.destination);
    if (!ds || !t.price) continue;
    const key = `${oSlug}-${slugify(ds.name)}`;
    if (routes[key] && routes[key].price <= t.price) continue;
    routes[key] = {
      o, oName, oFrom, ...ds, price: Math.round(t.price), dep: t.departure_at?.slice(0, 10), ret: t.return_at?.slice(0, 10) || null,
      airline: t.airline || null, transfers: t.transfers ?? null, months: {},
    };
    n++;
  }
  console.log(o, 'tras z ceną:', n, 'z', list.length);
  await sleep(400);
}

// 4. Ceny w kolejnych miesiącach dla tras (najpierw najtańsze, limit MAX_ROUTES)
const keys = Object.keys(routes).sort((a, b) => routes[a].price - routes[b].price).slice(0, MAX_ROUTES);
let done = 0;
for (const k of keys) {
  const r = routes[k];
  const g = await get('/aviasales/v3/grouped_prices', { origin: r.o, destination: r.d, group_by: 'month', one_way: 'false' });
  if (g && typeof g === 'object') {
    for (const [m, t] of Object.entries(g)) if (t?.price) r.months[m.slice(0, 7)] = Math.round(t.price);
  }
  if (++done % 100 === 0) console.log('miesiące:', done, '/', keys.length);
  await sleep(250);
}

// Zostawiamy trasy z cenami w co najmniej 2 miesiącach albo bardzo popularne (najtańszy lot)
const out = {};
for (const k of keys) {
  const r = routes[k];
  if (Object.keys(r.months).length < 2) continue;
  out[k] = r;
}
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync('data/flights.json', JSON.stringify({ updated: today, routes: out }));
console.log('Zapisano tras:', Object.keys(out).length);
