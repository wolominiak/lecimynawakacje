// Jednorazowy test: ile ofert obejmujących noc sylwestrową zwraca API widgetu i czy działa filtr dat.
import fs from 'node:fs';
const API = 'https://widget.wakacje.pl/v2/api/widgets/offers';
const base = { regions: [], cities: [], countries: [], limit: 100 };
const span = (o) => o.departureDate <= '2026-12-31' && o.returnDate >= '2027-01-01';
async function q(extra) {
  try {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ terms: { ...base, ...extra } }) });
    const j = await r.json();
    const d = Array.isArray(j.data) ? j.data : [];
    const months = {}; const ex = d.filter(span).slice(0,2).map((o)=>[o.name,o.departureDate,o.returnDate,o.price]); d.forEach((o) => { const k = o.departureDate.slice(0, 7); months[k] = (months[k] || 0) + 1; });
    return { n: d.length, span: d.filter(span).length, months, err: j.error || j.message || null, ex };
  } catch (e) { return { err: String(e) }; }
}
const out = {};
const variants = {
  plain: {},
  st_sylwester: { searchType: 'sylwester' },
  st_newyear: { searchType: 'newyear' },
  st_firstminute: { searchType: 'firstminute' },
  st_holiday: { searchType: 'holiday' },
  tag: { tags: ['sylwester'] },
  attributes: { attributes: ['sylwester'] },
  occasion: { occasion: 'sylwester' },
  theme: { theme: 'sylwester' },
  category: { category: 'sylwester' },
  query: { query: 'sylwester' },
  minPrice: { minPrice: 3500 },
  sort: { sort: 'date' },
  order: { orderBy: 'departureDate' },
  egSyl: { searchType: 'sylwester', countries: [JSON.parse(fs.readFileSync('data/wakacje-ids.json','utf8')).countries.egipt] },
};
for (const [k, v] of Object.entries(variants)) out[k] = await q(v);
fs.writeFileSync('data/probe-sylwester.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 4000));
