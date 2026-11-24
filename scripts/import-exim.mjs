// Import feedu Exim Tours z TradeDoublera (Unlimited, JSON) do public/exim/<kraj>.json
// Wymaga: sekretu EXIM_FEED_URL (lub TRADEDOUBLER_TOKEN). Pobiera tylko wtedy, gdy feed zmienił się od ostatniego importu
// (limit TradeDoublera: 3 pobrania tej samej wersji na 24 h).
// Użycie: TRADEDOUBLER_TOKEN=xxx node scripts/import-exim.mjs [--force]
import fs from 'fs';
import path from 'path';

// Sekret: EXIM_FEED_URL (pełny link Unlimited z TradeDoublera) albo TRADEDOUBLER_TOKEN
const FEED_URL = process.env.EXIM_FEED_URL || '';
const FID = Number((FEED_URL.match(/fid=(\d+)/) || [])[1]) || 103442;
const TOKEN = process.env.TRADEDOUBLER_TOKEN || (FEED_URL.match(/token=([^&;#]+)/) || [])[1];
if (!TOKEN) { console.error('Brak EXIM_FEED_URL lub TRADEDOUBLER_TOKEN (albo link nie zawiera token=)'); process.exit(1); }
const FORCE = process.argv.includes('--force');

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'public', 'exim');
const metaFile = path.join(root, 'data', 'exim-meta.json');
fs.mkdirSync(outDir, { recursive: true });
const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {};

const mask = (u) => u.replace(/token=[^&;#]+/, 'token=***');

// 1. Czy feed się zmienił? (jeśli endpoint nie odpowiada, pobieramy mimo to; import i tak idzie raz na dobę)
let last = null;
for (const base of ['https://api.tradedoubler.com/1.0/productsUnlimited/lastUpdated.json', 'https://api.tradedoubler.com/1.0/productsUnlimited/lastUpdated']) {
  const url = `${base};fid=${FID}?token=${TOKEN}`;
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    const body = await r.text();
    if (r.ok) {
      try { last = JSON.parse(body).lastUpdatedTime || null; } catch { last = (body.match(/\d{4}-\d{2}-\d{2}T[\d:.]+/) || [])[0] || null; }
      if (last) break;
    }
    console.warn('lastUpdated', r.status, mask(url), body.slice(0, 200).replace(TOKEN, '***'));
  } catch (e) { console.warn('lastUpdated błąd', e.message); }
}
console.log('Feed zaktualizowany:', last || 'nieznane', '| poprzedni import:', meta.feedUpdated || 'brak');
if (!FORCE && last && meta.feedUpdated === last) { console.log('Bez zmian, pomijam pobieranie.'); process.exit(0); }

// 2. Pobranie całego feedu (link z sekretu, jeśli to link Unlimited; inaczej budujemy go z tokenu)
const feedUrl = /productsUnlimited/.test(FEED_URL) ? FEED_URL : `https://api.tradedoubler.com/1.0/productsUnlimited.json;fid=${FID}?token=${TOKEN}`;
console.log('Pobieram:', mask(feedUrl));
const res = await fetch(feedUrl.replace(/^http:/, 'https:'), { headers: { Accept: 'application/json' } });
if (res.status === 429) { console.error('429: limit pobrań tej wersji feedu wyczerpany, spróbuj jutro.'); process.exit(1); }
if (!res.ok) { console.error('HTTP', res.status, (await res.text()).slice(0, 300).replace(TOKEN, '***')); process.exit(1); }
const data = await res.json();
const products = data.products || [];
console.log('Ofert w feedzie:', products.length);
if (!products.length) { console.error('Pusty feed - nic nie zapisuję.'); process.exit(1); }

// 3. Dopasowanie krajów do slugów portalu
const countries = JSON.parse(fs.readFileSync(path.join(root, 'data', 'countries.json'), 'utf8'));
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/[^a-z]/g, '');
const ALIAS = { emiratyarabskie: 'zjednoczone-emiraty-arabskie', zjednoczoneemiratyarabskie: 'zjednoczone-emiraty-arabskie', stanyzjednoczone: 'usa', stanyzjednoczoneameryki: 'usa', republikapoludniowejafryki: 'rpa', republikazielonegoprzyladka: 'wyspy-zielonego-przyladka' };
const bySlug = Object.fromEntries(countries.map((c) => [norm(c.name), c.slug]));
const slugFor = (name) => ALIAS[norm(name)] || bySlug[norm(name)] || null;

const BOARD = { AI: 'All inclusive', UAI: 'Ultra all inclusive', FB: 'Pełne wyżywienie', HB: 'Śniadania i obiadokolacje', BB: 'Śniadania', AO: 'Bez wyżywienia', OV: 'Bez wyżywienia' };
const field = (p, k) => (p.fields || []).find((f) => f.name === k)?.value;

const byCountry = {};
const missing = new Map();
for (const p of products) {
  const o = p.offers?.[0];
  if (!o?.productUrl) continue;
  const inner = decodeURIComponent((o.productUrl.match(/url\((.*)\)$/) || [])[1] || '');
  const q = new URLSearchParams(inner.split('?')[1] || '');
  const dd = q.get('DD');
  const rd = q.get('RD');
  if (!dd) continue;
  const [countryName, city] = String(p.description || '').split(',').map((s) => s.trim());
  const slug = slugFor(countryName || '');
  if (!slug) { missing.set(countryName, (missing.get(countryName) || 0) + 1); continue; }
  const boardCode = (q.get('DI') || '').split('-').pop();
  const price = Number(field(p, 'SalePrice') || o.priceHistory?.[0]?.price?.value || 0);
  const prev = Number(field(p, 'PreviousPrice') || 0);
  (byCountry[slug] ||= []).push({
    id: o.sourceProductId || o.id,
    n: p.name,
    c: city || '',
    r: field(p, 'DestinationName') || '',
    s: Number(field(p, 'Stars') || 0),
    d: field(p, 'Departue') || '',
    dd, rd,
    nn: Number(q.get('NN') || 0),
    b: BOARD[boardCode] || boardCode || '',
    bc: boardCode,
    a: Number(q.get('AC1') || 2),
    k: Number(q.get('KC1') || 0),
    p: price,
    pp: prev > price ? prev : 0,
    lm: field(p, 'isLastMinute') === 'true',
    img: p.productImage?.url || '',
    u: o.productUrl,
  });
}

// 4. Zapis: jeden plik na kraj + indeks
for (const f of fs.readdirSync(outDir)) if (f.endsWith('.json')) fs.unlinkSync(path.join(outDir, f));
const index = {};
const today = new Date().toISOString().slice(0, 10);
for (const [slug, list] of Object.entries(byCountry)) {
  const future = list.filter((x) => x.dd >= today).sort((a, b) => a.p - b.p);
  if (!future.length) continue;
  fs.writeFileSync(path.join(outDir, slug + '.json'), JSON.stringify(future));
  index[slug] = future.length;
}
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index));
fs.writeFileSync(metaFile, JSON.stringify({ feedUpdated: last || new Date().toISOString(), imported: new Date().toISOString(), offers: products.length, countries: index }, null, 1) + '\n');
console.log('Kraje:', Object.keys(index).length, index);
if (missing.size) console.log('Niedopasowane kraje:', Object.fromEntries(missing));
