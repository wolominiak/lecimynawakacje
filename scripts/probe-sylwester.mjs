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
    const months = {}; d.forEach((o) => { const k = o.departureDate.slice(0, 7); months[k] = (months[k] || 0) + 1; });
    return { n: d.length, span: d.filter(span).length, months, err: j.error || j.message || null };
  } catch (e) { return { err: String(e) }; }
}
const out = {};
const variants = {
  plain: {},
  dateFrom: { dateFrom: '2026-12-27', dateTo: '2027-01-02' },
  departureDateFrom: { departureDateFrom: '2026-12-27', departureDateTo: '2026-12-31' },
  date_from: { date_from: '2026-12-27', date_to: '2027-01-02' },
  departureDate: { departureDate: ['2026-12-27', '2026-12-31'] },
  dates: { dates: { from: '2026-12-27', to: '2027-01-02' } },
  departureFrom: { departureFrom: '2026-12-27', departureTo: '2026-12-31' },
  from: { from: '2026-12-27', to: '2027-01-02' },
  dateRange: { dateRange: ['2026-12-27', '2027-01-02'] },
  termFrom: { termFrom: '2026-12-27', termTo: '2027-01-02' },
  departureDateRange: { departureDate: { from: '2026-12-27', to: '2026-12-31' } },
  lastminute: { searchType: 'lastminute' },
};
for (const [k, v] of Object.entries(variants)) out[k] = await q(v);
// pokrycie per kraj bez filtra dat (id krajów jak na stronie)
const all = JSON.parse(fs.readFileSync('data/wakacje-ids.json', 'utf8')).countries;
const pick = ['egipt','turcja','hiszpania','zjednoczone-emiraty-arabskie','tajlandia','tanzania','dominikana','meksyk','malediwy','sri-lanka','wyspy-zielonego-przyladka','oman','portugalia','grecja','cypr','tunezja','maroko','kenia','wietnam','jordania','wlochy','francja','austria','czechy','malta'];
const countries = Object.fromEntries(pick.filter((k) => all[k]).map((k) => [k, all[k]]));
out.perCountry = {};
for (const [slug, id] of Object.entries(countries)) out.perCountry[slug] = (await q({ countries: [id] }));
fs.writeFileSync('data/probe-sylwester.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 4000));
