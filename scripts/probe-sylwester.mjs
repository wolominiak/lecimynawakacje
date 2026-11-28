// Test: ile ofert sylwestrowych/walentynkowych da się wyłowić skanując przedziały cen per kraj.
import fs from 'node:fs';
const API = 'https://widget.wakacje.pl/v2/api/widgets/offers';
const ids = JSON.parse(fs.readFileSync('data/wakacje-ids.json', 'utf8')).countries;
const NY = (o) => o.departureDate <= '2026-12-31' && o.returnDate >= '2027-01-01';
const VAL = (o) => o.departureDate <= '2027-02-14' && o.returnDate >= '2027-02-14';
async function q(t) {
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ terms: { regions: [], cities: [], countries: [], limit: 100, ...t } }) });
      const j = await r.json(); return Array.isArray(j.data) ? j.data : [];
    } catch { await new Promise((r) => setTimeout(r, 500)); }
  }
  return [];
}
const out = {}; const t0 = Date.now(); let reqs = 0;
const C = ['egipt', 'hiszpania', 'zjednoczone-emiraty-arabskie', 'tanzania', 'tajlandia', 'portugalia', 'turcja', 'wlochy'];
for (const c of C) {
  const seen = new Map();
  const bands = [];
  for (let p = 1000; p < 12000; p += 300) bands.push([p, p + 300]);
  const queue = [...bands];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const [a, b] = queue.shift(); reqs++;
      for (const o of await q({ countries: [ids[c]], minPrice: a, maxPrice: b })) seen.set(o.id, o);
    }
  }));
  const all = [...seen.values()];
  out[c] = { unique: all.length, ny: all.filter(NY).length, val: all.filter(VAL).length,
    nyEx: all.filter(NY).slice(0, 3).map((o) => [o.name, o.departureDate, o.returnDate, o.price, o.tourOperatorName]),
    maxBand: Math.max(...bands.map(() => 0)) };
}
out._meta = { reqs, sec: Math.round((Date.now() - t0) / 1000) };
fs.writeFileSync('data/probe-sylwester.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
