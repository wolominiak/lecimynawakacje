// Import feedu SeePlaces (PL) z TradeDoublera (Unlimited, fid 256046) do public/seeplaces/<kraj>.json
// Token: ten sam co dla Exim (sekret EXIM_FEED_URL albo TRADEDOUBLER_TOKEN).
// Feed nie ma pola z krajem, więc miejsce rozpoznajemy z nazwy, opisu i nazwy organizatora
// (polskie nazwy krajów i regionów z odmianą, angielskie nazwy krajów, atrakcje z przewodników).
// Użycie: TRADEDOUBLER_TOKEN=xxx node scripts/import-seeplaces.mjs [--force]
import fs from 'fs';
import path from 'path';

const FEED_URL = process.env.EXIM_FEED_URL || '';
const TOKEN = process.env.TRADEDOUBLER_TOKEN || (FEED_URL.match(/token=([^&;#]+)/) || [])[1];
if (!TOKEN) { console.error('Brak EXIM_FEED_URL lub TRADEDOUBLER_TOKEN'); process.exit(1); }
const FID = 256046;
const FORCE = process.argv.includes('--force');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'public', 'seeplaces');
const metaFile = path.join(root, 'data', 'seeplaces-meta.json');
fs.mkdirSync(outDir, { recursive: true });
const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {};
const mask = (u) => u.replace(/token=[^&;#]+/, 'token=***');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. Czy feed się zmienił?
let last = null;
try {
  const r = await fetch(`https://api.tradedoubler.com/1.0/productsUnlimited/lastUpdated.json;fid=${FID}?token=${TOKEN}`, { headers: { Accept: 'application/json' } });
  const body = await r.text();
  if (r.ok) { try { last = JSON.parse(body).lastUpdatedTime || null; } catch { last = (body.match(/\d{4}-\d{2}-\d{2}T[\d:.]+/) || [])[0] || null; } }
} catch {}
console.log('Feed zaktualizowany:', last || 'nieznane', '| poprzedni import:', meta.feedUpdated || 'brak');
if (!FORCE && last && meta.feedUpdated === last) { console.log('Bez zmian, pomijam.'); process.exit(0); }

// 2. Pobranie (plik generuje się asynchronicznie, ponawiamy co minutę)
const feedUrl = `https://api.tradedoubler.com/1.0/productsUnlimited.json;fid=${FID}?token=${TOKEN}`;
console.log('Pobieram:', mask(feedUrl));
let products = [];
for (let attempt = 1; attempt <= 15; attempt++) {
  const res = await fetch(feedUrl, { headers: { Accept: 'application/json' } });
  const body = await res.text();
  if (res.status === 429) { console.error('429: limit pobrań wyczerpany, spróbuj jutro.'); process.exit(1); }
  try { products = JSON.parse(body).products || []; } catch { products = []; }
  console.log(`Próba ${attempt}: HTTP ${res.status}, ${body.length} B, produktów: ${products.length}`);
  if (products.length) break;
  if (res.status >= 400 && res.status !== 404 && res.status !== 202) { console.log(body.slice(0, 300).replace(TOKEN, '***')); process.exit(1); }
  await sleep(60000);
}
if (!products.length) { console.error('Feed pusty po 15 minutach.'); process.exit(1); }

// 3. Słownik miejsc
const countries = JSON.parse(fs.readFileSync(path.join(root, 'data', 'countries.json'), 'utf8'));
const norm = (s) => ' ' + String(s || '').toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
const MUT = { t: ['c'], d: ['dz'], r: ['rz'], k: ['c'], g: ['dz'], s: ['si', 'sz'], n: ['ni'], z: ['zi'] };
// rdzeń nazwy z wariantami polskiej odmiany (Kreta -> Krecie, Malta -> Malcie)
function stems(name) {
  const x = norm(name).trim();
  if (x.length < 4) return [];
  const st = x.length <= 5 ? x.slice(0, 4) : x.slice(0, Math.max(5, x.length - 2));
  return [st, ...(MUT[st.slice(-1)] || []).map((m) => st.slice(0, -1) + m)];
}
const en = new Intl.DisplayNames(['en'], { type: 'region' });
const keys = []; // { stems[], exact, kraj, region, w }
const add = (name, kraj, region, w, exactOnly = false) => {
  const e = norm(name).trim();
  if (e.length < 3) return;
  keys.push({ exact: ' ' + e + ' ', stems: exactOnly ? [] : stems(name), kraj, region, w });
};
// angielskie nazwy regionów, które pojawiają się u organizatorów
const EN_REG = { crete: 'grecja/kreta', heraklion: 'grecja/kreta', heraklio: 'grecja/kreta', chania: 'grecja/kreta', rhodes: 'grecja/rodos', corfu: 'grecja/korfu', zakynthos: 'grecja/zakynthos', kos: 'grecja/kos', santorini: 'grecja/santorini', halkidiki: 'grecja/chalkidiki', tenerife: 'hiszpania/teneryfa', mallorca: 'hiszpania/majorka', majorca: 'hiszpania/majorka', 'gran canaria': 'hiszpania/gran-canaria', fuerteventura: 'hiszpania/fuerteventura', lanzarote: 'hiszpania/lanzarote', 'costa del sol': 'hiszpania/costa-del-sol', barcelona: 'hiszpania/barcelona', algarve: 'portugalia/algarve', madeira: 'portugalia/madera', antalya: 'turcja/antalya', alanya: 'turcja/alanya', side: 'turcja/side', belek: 'turcja/belek', kemer: 'turcja/kemer', bodrum: 'turcja/bodrum', istanbul: 'turcja/stambul', hurghada: 'egipt/hurghada', 'sharm el sheikh': 'egipt/sharm-el-sheikh', 'marsa alam': 'egipt/marsa-alam', djerba: 'tunezja/djerba', sicily: 'wlochy/sycylia', sardinia: 'wlochy/sardynia', rome: 'wlochy/rzym', dubrovnik: 'chorwacja/dubrownik', split: 'chorwacja/dalmacja', zanzibar: 'tanzania/zanzibar', phuket: 'tajlandia/phuket', bali: 'indonezja/bali', dubai: 'zjednoczone-emiraty-arabskie/dubaj', reykjavik: 'islandia', gize: 'egipt', gizie: 'egipt', kair: 'egipt', kairze: 'egipt', aleksandria: 'egipt', luksor: 'egipt', neapol: 'wlochy', neapolu: 'wlochy', pompeje: 'wlochy', amsterdam: 'holandia', paryz: 'francja', londyn: 'wielka-brytania', 'nowy jork': 'usa', 'new york': 'usa', toronto: 'kanada', lizbona: 'portugalia', porto: 'portugalia', praga: 'czechy', wieden: 'austria', budapeszt: 'wegry', maskat: 'oman', muscat: 'oman', salalah: 'oman', marrakesz: 'maroko', agadir: 'maroko' };
for (const c of countries) {
  let ct = null;
  try { ct = JSON.parse(fs.readFileSync(path.join(root, 'content', 'countries', c.slug + '.json'), 'utf8')); } catch {}
  if (!ct) continue;
  add(c.name, c.slug, null, 1);
  try { const e = en.of(c.code); if (e) add(e, c.slug, null, 1, true); } catch {}
  for (const r of ct.regions || []) add(r.name, c.slug, r.slug, 3);
  // atrakcje wskazują kraj, ale tylko pełną nazwą (ogólne słowa jak "Piramidy" czy "Wodospady" myliłyby kraje)
  for (const a of ct.attractions || []) if (a.name.length >= 8) add(a.name, c.slug, null, 2, true);
}
const regionsOf = Object.fromEntries(countries.map((c) => {
  try { return [c.slug, new Set((JSON.parse(fs.readFileSync(path.join(root, 'content', 'countries', c.slug + '.json'), 'utf8')).regions || []).map((r) => r.slug))]; } catch { return [c.slug, new Set()]; }
}));
for (const [k, v] of Object.entries(EN_REG)) { const [kraj, region] = v.split('/'); add(k, kraj, region && regionsOf[kraj]?.has(region) ? region : null, 4, true); }

function locate(text) {
  const t = norm(text);
  let best = null;
  for (const k of keys) {
    const hit = t.includes(k.exact) || k.stems.some((s) => t.includes(' ' + s));
    if (!hit) continue;
    const score = k.w * 10 + k.exact.length;
    if (!best || score > best.score) best = { ...k, score };
  }
  return best;
}

// 4. Przetworzenie
const field = (p, k) => (p.fields || []).find((f) => f.name === k)?.value;
const price = (s) => Number(String(s || '').replace(/[^\d.]/g, '')) || 0;
const clean = (s) => String(s || '').replace(/\s*[–—]\s*/g, ' - ').replace(/\s+/g, ' ').trim();
const byCountry = {};
let matched = 0;
for (const p of products) {
  const o = p.offers?.[0];
  if (!o?.productUrl || !p.name) continue;
  // wycieczki prowadzone w innym języku niż polski (np. "w j.czeskim", "w języku japońskim") pomijamy
  if (/w\s*j(\.|ęzyku)\s*(?!pol)[a-ząćęłńóśźż]+/i.test(p.name)) continue;
  const where = locate(`${p.name} ${field(p, 'manufacturer') || ''} ${(p.description || '').slice(0, 400)}`);
  if (!where) continue;
  matched++;
  const cat = (p.categories?.[0]?.name || '').split('\n').map((x) => x.trim()).filter(Boolean)[0] || '';
  const pr = price(field(p, 'BestPrice')) || price(o.priceHistory?.[0]?.price?.value);
  const old = price(field(p, 'OldPrice'));
  (byCountry[where.kraj] ||= []).push({
    id: o.id, n: clean(p.name), d: clean(p.description).slice(0, 220), img: p.productImage?.url || '',
    p: Math.round(pr), op: old > pr ? Math.round(old) : 0, cat, r: where.region || '',
    best: field(p, 'isBestseller') === 'yes' ? 1 : 0, u: o.productUrl,
  });
}

for (const f of fs.readdirSync(outDir)) if (f.endsWith('.json')) fs.unlinkSync(path.join(outDir, f));
const index = {};
for (const [k, list] of Object.entries(byCountry)) {
  list.sort((a, b) => b.best - a.best || a.p - b.p);
  fs.writeFileSync(path.join(outDir, k + '.json'), JSON.stringify(list));
  index[k] = list.length;
}
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index));
fs.writeFileSync(metaFile, JSON.stringify({ feedUpdated: last, imported: new Date().toISOString(), products: products.length, matched, countries: index }, null, 1) + '\n');
console.log(`Produktów: ${products.length}, przypisanych do krajów: ${matched}.`);
console.log(Object.entries(index).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, n]) => `${k} ${n}`).join(', '));
