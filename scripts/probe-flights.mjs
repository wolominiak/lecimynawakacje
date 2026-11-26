// Test: jakie pola zwracają zapytania Data API (bez wypisywania tokena)
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
const API = 'https://api.travelpayouts.com';
async function show(name, p, params) {
  const q = new URLSearchParams({ currency: 'pln', market: 'pl', ...params });
  const r = await fetch(`${API}${p}?${q}`, { headers: { 'X-Access-Token': TOKEN } });
  const j = await r.json().catch(() => null);
  const d = j?.data;
  const arr = Array.isArray(d) ? d : d && typeof d === 'object' ? Object.values(d) : [];
  console.log(`\n=== ${name} status ${r.status} items ${arr.length}`);
  for (const x of arr.slice(0, 3)) console.log(JSON.stringify(x).replace(/"link":"[^"]*"/, '"link":"..."'));
}
await show('v3 prices_for_dates', '/aviasales/v3/prices_for_dates', { origin: 'WAW', destination: 'ROM', one_way: 'false', sorting: 'price', limit: '3' });
await show('v3 grouped_prices', '/aviasales/v3/grouped_prices', { origin: 'WAW', destination: 'ROM', group_by: 'month', one_way: 'false' });
await show('v3 get_latest_prices', '/aviasales/v3/get_latest_prices', { origin: 'WAW', destination: 'ROM', one_way: 'false', sorting: 'price', limit: '3', period_type: 'year', group_by: 'dates' });
await show('v2 prices/latest', '/v2/prices/latest', { origin: 'WAW', destination: 'ROM', one_way: 'false', sorting: 'price', limit: '3', period_type: 'year', show_to_affiliates: 'true' });
