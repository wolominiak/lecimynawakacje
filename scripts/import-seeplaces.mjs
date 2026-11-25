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
// Klucz: { kraj, region, w, test(text, raw) }. Krótkie nazwy (do 5 liter) tylko jako osobne słowo wielką literą
// z polską końcówką (Katar, w Katarze), żeby nie łapać "katamaran", "samochód", "pałac".
const keys = [];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function add(name, kraj, region, w, exactOnly = false, ci = false) {
  const e = norm(name).trim();
  if (e.length < 3) return;
  let test;
  if (e.replace(/ /g, '').length <= 5) {
    const base = String(name).trim();
    const stem = /[aeiouyąę]$/i.test(base) ? base.slice(0, -1) : base;
    const re = new RegExp(`(^|[^\\p{L}])${esc(stem)}(u|ze|em|ie|ii|i|y|a|o|ę|ą|ach|om)?(?![\\p{L}])`, ci ? 'iu' : 'u');
    test = (_t, raw) => re.test(raw);
  } else {
    const exact = ' ' + e + ' ';
    const st = exactOnly ? [] : stems(name);
    test = (t) => t.includes(exact) || st.some((x) => t.includes(' ' + x));
  }
  keys.push({ kraj, region, w, test });
}
const pop = {};
// mikropaństwa, których nazwy częściej są czymś innym (Palau Güell w Barcelonie, wyspa Samos)
const EXCL = new Set(['palau', 'samoa', 'nauru', 'tuvalu', 'kiribati', 'wyspy-marshalla', 'mikronezja', 'tonga', 'niue', 'tokelau', 'wallis-i-futuna']);
// regiony o ogólnych nazwach ("Południowe wybrzeże", "Północ") nic nie mówią o kraju
const GENERIC = /^(poludni|polnoc|wschod|zachod|centr|srodk|wybrzez|gory|gorsk|nizin|wyspy|region|park|dolina|polwysep|interior|stolica|miasto)/;
const world = (() => { try { return JSON.parse(fs.readFileSync(path.join(root, 'node_modules', 'world-countries', 'countries.json'), 'utf8')); } catch { return []; } })();
const capitals = Object.fromEntries(world.map((w) => [w.cca2, w.capital || []]));
for (const c of countries) {
  if (EXCL.has(c.slug)) continue;
  let ct = null;
  try { ct = JSON.parse(fs.readFileSync(path.join(root, 'content', 'countries', c.slug + '.json'), 'utf8')); } catch {}
  if (!ct) continue;
  pop[c.slug] = Number(ct.popularity) || 0;
  add(c.name, c.slug, null, 1);
  try { const e = en.of(c.code); if (e && e.length > 5) add(e, c.slug, null, 1, true); } catch {}
  for (const r of ct.regions || []) if (!GENERIC.test(norm(r.name).trim())) add(r.name, c.slug, r.slug, 3);
  for (const cap of capitals[c.code] || []) if (cap.length >= 4) add(cap, c.slug, null, 2, true);
  // atrakcje wskazują kraj, ale tylko pełną nazwą (ogólne słowa jak "Piramidy" czy "Wodospady" myliłyby kraje)
  for (const a of ct.attractions || []) if (a.name.length >= 8) add(a.name, c.slug, null, 2, true);
}
const regionsOf = Object.fromEntries(countries.map((c) => {
  try { return [c.slug, new Set((JSON.parse(fs.readFileSync(path.join(root, 'content', 'countries', c.slug + '.json'), 'utf8')).regions || []).map((r) => r.slug))]; } catch { return [c.slug, new Set()]; }
}));
// Nazwy miast i regionów (też angielskie) oraz niejednoznaczne nazwy z przypisanym krajem. Mocniejsze niż słownik.
const EN_REG = { crete: 'grecja/kreta', heraklion: 'grecja/kreta', heraklio: 'grecja/kreta', chania: 'grecja/kreta', rhodes: 'grecja/rodos', corfu: 'grecja/korfu', zakynthos: 'grecja/zakynthos', kos: 'grecja/kos', santorini: 'grecja/santorini', halkidiki: 'grecja/chalkidiki', tenerife: 'hiszpania/teneryfa', mallorca: 'hiszpania/majorka', majorca: 'hiszpania/majorka', 'gran canaria': 'hiszpania/gran-canaria', fuerteventura: 'hiszpania/fuerteventura', lanzarote: 'hiszpania/lanzarote', 'costa del sol': 'hiszpania/costa-del-sol', barcelona: 'hiszpania/barcelona', algarve: 'portugalia/algarve', madeira: 'portugalia/madera', antalya: 'turcja/antalya', alanya: 'turcja/alanya', side: 'turcja/side', belek: 'turcja/belek', kemer: 'turcja/kemer', bodrum: 'turcja/bodrum', istanbul: 'turcja/stambul', hurghada: 'egipt/hurghada', 'sharm el sheikh': 'egipt/sharm-el-sheikh', 'marsa alam': 'egipt/marsa-alam', djerba: 'tunezja/djerba', sicily: 'wlochy/sycylia', sardinia: 'wlochy/sardynia', rome: 'wlochy/rzym', dubrovnik: 'chorwacja/dubrownik', split: 'chorwacja/dalmacja', zanzibar: 'tanzania/zanzibar', phuket: 'tajlandia/phuket', bali: 'indonezja/bali', dubai: 'zjednoczone-emiraty-arabskie/dubaj', reykjavik: 'islandia', gize: 'egipt', gizie: 'egipt', kair: 'egipt', kairze: 'egipt', aleksandria: 'egipt', luksor: 'egipt', neapol: 'wlochy', neapolu: 'wlochy', pompeje: 'wlochy', amsterdam: 'holandia', paryz: 'francja', londyn: 'wielka-brytania', 'nowy jork': 'usa', 'new york': 'usa', toronto: 'kanada', lizbona: 'portugalia', porto: 'portugalia', praga: 'czechy', wieden: 'austria', budapeszt: 'wegry', maskat: 'oman', muscat: 'oman', salalah: 'oman', marrakesz: 'maroko', agadir: 'maroko' };
Object.assign(EN_REG, { thassos: 'grecja', elafonisi: 'grecja/kreta', vai: 'grecja/kreta', nisyros: 'grecja/kos', kasonisi: 'grecja/kreta', spinalonga: 'grecja/kreta', balos: 'grecja/kreta', lindos: 'grecja/rodos', symi: 'grecja/rodos', meteory: 'grecja', wieden: 'austria', wiedniu: 'austria', wiednia: 'austria', schonbrunn: 'austria', belvedere: 'austria', kordobie: 'hiszpania', kordoby: 'hiszpania', montserrat: 'hiszpania', murano: 'wlochy', burano: 'wlochy', wenecji: 'wlochy', wenecja: 'wlochy', 'kuala gandah': 'malezja', sakkara: 'egipt', sakkary: 'egipt', memfis: 'egipt', fajum: 'egipt', sorrento: 'wlochy', positano: 'wlochy', amalfi: 'wlochy', giza: 'egipt', gizy: 'egipt', 'el gouna': 'egipt/hurghada', dahab: 'egipt', 'marsa matrouh': 'egipt', 'el quseir': 'egipt', siwa: 'egipt', makadi: 'egipt/hurghada', 'soma bay': 'egipt/hurghada', safaga: 'egipt/hurghada', 'sahl hasheesh': 'egipt/hurghada', tirana: 'albania', berat: 'albania', beratu: 'albania', kruja: 'albania', vlora: 'albania/wlora', vlore: 'albania/wlora', wlora: 'albania/wlora', wlory: 'albania/wlora', durres: 'albania/durres', sarande: 'albania', ksamil: 'albania', szkodra: 'albania', 'palau guell': 'hiszpania', 'palau march': 'hiszpania', 'palma de mallorca': 'hiszpania/majorka', mauritius: 'mauritius', willemstad: 'curacao', penang: 'malezja', 'khao sok': 'tajlandia', krabi: 'tajlandia', 'koh samui': 'tajlandia', pattaya: 'tajlandia', 'sharm': 'egipt/sharm-el-sheikh', luxor: 'egipt', kotor: 'czarnogora', budva: 'czarnogora/budva',  granada: 'hiszpania', walencja: 'hiszpania', valencia: 'hiszpania', walencji: 'hiszpania', kordoba: 'hiszpania', sewilla: 'hiszpania', malaga: 'hiszpania', maladze: 'hiszpania', girona: 'hiszpania', 'costa brava': 'hiszpania', samos: 'grecja', pamukkale: 'turcja', kapadocja: 'turcja', kopenhaga: 'dania', kopenhadze: 'dania', copenhagen: 'dania', 'gora mojzesza': 'egipt', 'synaj': 'egipt', doha: 'katar', 'santa susanna': 'hiszpania', 'calella': 'hiszpania', 'lloret': 'hiszpania' });
for (const [k, v] of Object.entries(EN_REG)) { const [kraj, region] = v.split('/'); add(k, kraj, region && regionsOf[kraj]?.has(region) ? region : null, 5, true, true); }
// przymiotniki od nazw krajów ("Muzeum Egipskie", "greckie wyspy"): słaby dowód, tylko jako początek słowa
const ADJ = { egipsk: 'egipt', greck: 'grecja', hiszpansk: 'hiszpania', wlosk: 'wlochy', portugalsk: 'portugalia', cypryjsk: 'cypr', chorwack: 'chorwacja', marokansk: 'maroko', tajlandzk: 'tajlandia', islandzk: 'islandia', francusk: 'francja', holendersk: 'holandia', dunsk: 'dania', austriack: 'austria', wegiersk: 'wegry', czarnogorsk: 'czarnogora', albansk: 'albania', bulgarsk: 'bulgaria', tunezyjsk: 'tunezja', omansk: 'oman', kenijsk: 'kenia', wietnamsk: 'wietnam', balijsk: 'indonezja', zanzibarsk: 'tanzania', kanaryjsk: 'hiszpania', maltansk: 'malta', madeyrsk: 'portugalia' };
for (const [st, kraj] of Object.entries(ADJ)) keys.push({ kraj, region: null, w: 1, test: (t) => t.includes(' ' + st) });

// Dowody z nazwy wycieczki ważą 3 razy, od organizatora 2 razy, z opisu raz. Wygrywa kraj z największą sumą,
// przy remisie popularniejszy. Sam opis musi być mocnym dowodem (region albo kilka trafień).
function locate(name, maker, desc) {
  const parts = [[name, 3], [maker, 2], [desc, 1]].map(([raw, m]) => ({ raw: String(raw || ''), t: norm(raw), m }));
  const score = {}; const reg = {};
  for (const k of keys) {
    let best = 0;
    for (const p of parts) if (p.m > best && k.test(p.t, p.raw)) best = p.m;
    if (!best) continue;
    const v = k.w * best;
    score[k.kraj] = (score[k.kraj] || 0) + v;
    if (k.region && (!reg[k.kraj] || v > reg[k.kraj].v)) reg[k.kraj] = { region: k.region, v };
  }
  let win = null;
  for (const [kraj, v] of Object.entries(score)) {
    const total = v + (pop[kraj] || 0) / 4;
    if (!win || total > win.total) win = { kraj, total, raw: v };
  }
  if (!win || win.raw < 3) return null;
  return { kraj: win.kraj, region: reg[win.kraj]?.region || null };
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
  const where = locate(p.name, field(p, 'manufacturer'), (p.description || '').slice(0, 500));
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
