// Karty hoteli: lista hoteli z ofert wakacje.pl (API widgetu TravelLead) + własny opis z publicznych faktów.
// 1) zbiera hotele z ofert w każdym kraju -> data/hotels-index.json
// 2) dla brakujących hoteli: Gemini z wyszukiwarką Google zbiera fakty, drugi krok pisze własny tekst po polsku,
//    OpenStreetMap (Nominatim) daje współrzędne -> content/hotels/<slug>.json
// Opcje: --limit N (domyślnie 60), --only kraj1,kraj2, --force, --index-only
// Wymaga GEMINI_API_KEY (poza --index-only).
import fs from 'fs';
import path from 'path';
import { matchHotel, normName } from './hotelmatch.mjs';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d; };
const LIMIT = Number(arg('limit', 60));
const ONLY = arg('only', '') ? String(arg('only')).split(',') : null;
const FORCE = !!arg('force', false);
const INDEX_ONLY = !!arg('index-only', false);
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = 'content/hotels';
fs.mkdirSync(OUT, { recursive: true });

const clean = (v) => typeof v === 'string' ? v.replace(/\s*[–—]\s*/g, ' - ').trim()
  : Array.isArray(v) ? v.map(clean) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)])) : v;
function parseLoose(t) {
  const s = t.replace(/^```(json)?/m, '').replace(/```\s*$/m, '').trim();
  try { return JSON.parse(s); } catch { const a = s.indexOf('{'), b = s.lastIndexOf('}'); return JSON.parse(s.slice(a, b + 1)); }
}

// ---------- 1. Lista hoteli ----------
const ids = JSON.parse(fs.readFileSync('data/wakacje-ids.json', 'utf8')).countries;
const indexFile = 'data/hotels-index.json';
const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : {};

async function offers(terms) {
  try {
    const r = await fetch('https://widget.wakacje.pl/v2/api/widgets/offers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terms: { regions: [], cities: [], countries: [], limit: 100, ...terms } }),
    });
    const j = await r.json();
    return Array.isArray(j.data) ? j.data : [];
  } catch { return []; }
}

const countries = Object.entries(ids).filter(([slug, id]) => id !== 521 && (!ONLY || ONLY.includes(slug)));
const seenNow = new Map();
for (const [slug, id] of countries) {
  // wiele różnych zapytań, bo API zwraca maks. 100 ofert naraz, a każde zapytanie daje trochę inną pulę hoteli
  const variants = [{}, { service: [1] }, { service: [2] }, { service: [3] }, { service: [4] }, { searchType: 'lastminute' }, { searchType: 'firstminute' },
    { maxPrice: 2000 }, { maxPrice: 3000 }, { maxPrice: 4500 }, { maxPrice: 7000 }, { service: [1], maxPrice: 3500 }, { service: [1], searchType: 'lastminute' }];
  const lists = await Promise.all(variants.map((v) => offers({ countries: [id], ...v })));
  for (const o of lists.flat()) {
    if (!o.hotelId || !o.hotelUrlName || /objazd/i.test(o.placeName?.[1] || '') || o.placeName?.[0] === 'Polska') continue;
    const cur = seenNow.get(o.hotelId) || {
      id: o.hotelId, slug: o.hotelUrlName, name: o.name, country: slug, place: o.placeName || [], stars: o.category || 0,
      photo: o.photo || null, rating: o.ratingValue || 0, recommends: o.ratingRecommends || 0, offers: 0, minPrice: 0,
    };
    cur.offers++;
    const p = Number(String(o.price).replace(/\s/g, '')) || 0;
    if (p && (!cur.minPrice || p < cur.minPrice)) cur.minPrice = p;
    seenNow.set(o.hotelId, cur);
  }
  await sleep(150);
}
for (const h of seenNow.values()) index[h.id] = { ...index[h.id], ...clean(h), seen: new Date().toISOString().slice(0, 10) };

// hotele, które są tylko w ofertach Exim (public/exim/<kraj>.json), dostają własne wpisy "x:kraj:nazwa"
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const usedSlugs = new Set(Object.values(index).map((h) => h.slug));
let eximNew = 0;
const exDir = 'public/exim';
for (const f of fs.existsSync(exDir) ? fs.readdirSync(exDir).filter((x) => x.endsWith('.json') && x !== 'index.json') : []) {
  const country = f.slice(0, -5);
  if (ONLY && !ONLY.includes(country)) continue;
  let cName = country;
  try { cName = JSON.parse(fs.readFileSync(`content/countries/${country}.json`, 'utf8')).name || country; } catch { /* brak przewodnika */ }
  const wk = Object.values(index).filter((h) => h.country === country && typeof h.id === 'number');
  const today = new Date().toISOString().slice(0, 10);
  for (const o of JSON.parse(fs.readFileSync(path.join(exDir, f), 'utf8'))) {
    if (!o.n || o.dd < today) continue;
    const key = `x:${country}:${normName(o.n)}`;
    if (index[key]) { index[key].offers++; continue; }
    if (wk.some((h) => matchHotel(o.n, [o.c, o.r], h.name, h.place.slice(1)))) continue;
    let slug = slugify(o.n);
    if (usedSlugs.has(slug)) slug = `${slug}-${slugify(o.c || country)}`;
    if (usedSlugs.has(slug)) continue;
    usedSlugs.add(slug);
    index[key] = { id: key, slug, name: clean(o.n), country, place: clean([cName, o.r, o.c].filter((x, i, a) => x && a.indexOf(x) === i)), stars: o.s || 0, photo: o.img || null, rating: 0, recommends: 0, offers: 1, minPrice: 0, src: 'exim', seen: today };
    eximNew++;
  }
}
console.log('Nowe hotele tylko z Exim:', eximNew);
fs.writeFileSync(indexFile, JSON.stringify(index));
console.log('Hoteli w indeksie:', Object.keys(index).length, '(teraz w ofertach:', seenNow.size, ')');
if (INDEX_ONLY) process.exit(0);
if (!KEY) { console.error('Brak GEMINI_API_KEY'); process.exit(1); }

// ---------- 2. Opisy ----------
async function gemini(body) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.status === 429 || r.status === 503) { await sleep(30000 * (i + 1)); continue; }
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return r.json();
  }
  throw new Error('limit API');
}

// krok A: fakty z wyszukiwarki Google
async function research(h) {
  const where = [...h.place].reverse().join(', ');
  const prompt = `Znajdź w internecie aktualne, publiczne informacje o hotelu "${h.name}" (${where}). Kategoria w ofertach biur: ${h.stars || '?'}*.
Wypisz WYŁĄCZNIE sprawdzone fakty w punktach (bez przepisywania opisów z innych stron, własnymi słowami, krótko):
- dokładna lokalizacja (miejscowość, dzielnica, przy jakiej plaży/zatoce), adres, współrzędne GPS hotelu (np. z Google Maps)
- odległość od plaży, rodzaj plaży (piaszczysta, kamienista, żwirowa, wejście z pomostu, rafa), czy plaża jest hotelowa, leżaki, ręczniki
- odległość od najbliższego lotniska (nazwa lotniska) i od centrum miejscowości
- rok otwarcia i ostatniego remontu, liczba pokoi, wielkość terenu, rodzaj zabudowy (jeden budynek, bungalowy)
- baseny (ile, podgrzewane, kryte), zjeżdżalnie/aquapark, strefa dla dzieci, mini klub, animacje
- restauracje i bary, co obejmuje all inclusive (jeśli wiadomo)
- spa, siłownia, sporty, wifi, czy hotel jest tylko dla dorosłych
- typy pokoi i ich wyposażenie
- dla kogo hotel jest najbardziej polecany (rodziny, pary, nurkowie...), typowe zalety i wady wymieniane w opiniach gości
Jeśli czegoś nie da się potwierdzić, pomiń. Jeśli nie da się jednoznacznie zidentyfikować hotelu, napisz tylko: NIE ZNALEZIONO.`;
  const j = await gemini({ contents: [{ role: 'user', parts: [{ text: prompt }] }], tools: [{ google_search: {} }], generationConfig: { temperature: 0.2 } });
  const cand = j.candidates?.[0];
  const text = cand?.content?.parts?.map((p) => p.text || '').join('') || '';
  const sources = (cand?.groundingMetadata?.groundingChunks || []).map((c) => c.web?.title).filter(Boolean);
  return { text, sources: [...new Set(sources)].slice(0, 8) };
}

const S = (d) => ({ type: 'STRING', description: d });
const N = (d) => ({ type: 'NUMBER', description: d, nullable: true });
const B = (d) => ({ type: 'BOOLEAN', description: d, nullable: true });
const SCHEMA = {
  type: 'OBJECT',
  properties: {
    found: { type: 'BOOLEAN', description: 'czy fakty jednoznacznie dotyczą tego hotelu' },
    city: S('miejscowość'),
    area: S('dzielnica, zatoka lub okolica, puste jeśli brak'),
    address: S('adres, puste jeśli brak'),
    lat: N('szerokość geograficzna hotelu, jeśli podana w faktach'),
    lon: N('długość geograficzna, tylko jeśli podana w faktach'),
    beachDistanceM: N('odległość od plaży w metrach'),
    beachType: S('rodzaj plaży po polsku, puste jeśli brak'),
    privateBeach: B('czy plaża hotelowa'),
    airportName: S('najbliższe lotnisko, puste jeśli brak'),
    airportKm: N('odległość od lotniska w km'),
    centerKm: N('odległość od centrum miejscowości w km'),
    opened: N('rok otwarcia'),
    renovated: N('rok ostatniego remontu'),
    rooms: N('liczba pokoi'),
    pools: N('liczba basenów'),
    heatedPool: B('basen podgrzewany'),
    aquapark: B('zjeżdżalnie lub aquapark'),
    kidsClub: B('mini klub dla dzieci'),
    animations: B('animacje'),
    spa: B('spa'),
    gym: B('siłownia'),
    wifi: B('wifi'),
    adultsOnly: B('tylko dla dorosłych'),
    restaurants: N('liczba restauracji'),
    bars: N('liczba barów'),
    roomTypes: { type: 'ARRAY', items: S('typ pokoju z krótkim opisem wyposażenia') },
    amenities: { type: 'ARRAY', items: S('udogodnienie, krótko') },
    goodFor: { type: 'ARRAY', items: S('dla kogo, np. rodziny z dziećmi') },
    pros: { type: 'ARRAY', items: S('zaleta, krótko') },
    cons: { type: 'ARRAY', items: S('wada lub na co uważać, krótko') },
    intro: { type: 'ARRAY', items: S('akapit opisu') },
    sections: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { title: S('nagłówek sekcji'), text: S('treść sekcji') }, required: ['title', 'text'] },
    },
    faq: { type: 'ARRAY', items: { type: 'OBJECT', properties: { q: S('pytanie'), a: S('odpowiedź') }, required: ['q', 'a'] } },
  },
  required: ['found', 'city', 'intro', 'sections', 'pros', 'cons', 'faq'],
};

// krok B: własny tekst na podstawie faktów
async function write(h, facts) {
  const where = [...h.place].reverse().join(', ');
  const prompt = `Jesteś redaktorem polskiego portalu turystycznego lecimynawakacje.pl. Na podstawie FAKTÓW poniżej przygotuj kartę hotelu "${h.name}" (${where}, ${h.stars || '?'}*).
Zasady:
- Pisz własnymi słowami, naturalną polszczyzną, konkretnie i rzeczowo, bez marketingowych zachwytów i bez pustych frazesów.
- Używaj tylko faktów podanych niżej. Nie dopisuj niczego, czego w nich nie ma. Brakujące pola zostaw puste lub null.
- Nie używaj długich myślników (tylko zwykły łącznik "-").
- intro: 2 akapity (razem 450-700 znaków): gdzie leży hotel, jaki ma charakter, dla kogo jest.
- sections: 4-6 sekcji z tytułami, np. "Położenie i plaża", "Pokoje", "Wyżywienie i restauracje", "Baseny i rekreacja", "Dla dzieci", "Dla kogo ten hotel" (tylko te, o których są fakty), każda 2-4 zdania.
- pros i cons: po 3-5 krótkich punktów (cons uczciwie, np. odległość od plaży, starsze pokoje, jeśli fakty o tym mówią).
- faq: 4-6 pytań, które zadają klienci (odległość od plaży, lotnisko, czy jest aquapark, czy dobry dla dzieci, wifi...), odpowiedzi z faktów.
- found = false, jeśli fakty mówią NIE ZNALEZIONO albo dotyczą innego hotelu.

FAKTY:
${facts}`;
  const j = await gemini({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0.5, maxOutputTokens: 8192, thinkingConfig: { thinkingBudget: 0 } },
  });
  return clean(parseLoose(j.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '{}'));
}

// współrzędne z OpenStreetMap (limit 1 zapytanie na sekundę, wspólna kolejka dla wszystkich wątków)
let osmQueue = Promise.resolve();
const osmSlot = () => { const p = osmQueue.then(() => sleep(1100)); osmQueue = p; return p; };
async function geocode(h, city) {
  const country = h.place[0];
  const base = h.name.replace(/\(.*?\)/g, '').replace(/\b(ex|dawniej)\b.*$/i, '').trim();
  for (const q of [`${base}, ${city || h.place.at(-1)}, ${country}`, `${base}, ${country}`, `${base} hotel`]) {
    try {
      await osmSlot();
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=pl&q=${encodeURIComponent(q)}`, {
        headers: { 'User-Agent': 'lecimynawakacje.pl hotel pages (kontakt: lecimynawakacje.pl)' },
      });
      const j = await r.json();
      if (j[0] && /hotel|tourism|resort|guest|apartment|building/i.test(`${j[0].type} ${j[0].class} ${j[0].display_name}`)) return { lat: +j[0].lat, lon: +j[0].lon, src: 'osm' };
    } catch { /* następna próba */ }
  }
  return null;
}

// najpierw najpopularniejsze kierunki Polaków, potem reszta
const TOP = ['egipt', 'turcja', 'grecja', 'hiszpania', 'tunezja', 'bulgaria', 'albania', 'cypr', 'chorwacja', 'wlochy', 'portugalia', 'czarnogora', 'maroko', 'zjednoczone-emiraty-arabskie', 'malta', 'tajlandia', 'dominikana', 'meksyk', 'tanzania', 'kuba'];
const prio = (h) => { const i = TOP.indexOf(h.country); return i < 0 ? 99 : i; };
const todo = Object.values(index)
  .filter((h) => (!ONLY || ONLY.includes(h.country)) && !h.failed && (FORCE || !fs.existsSync(path.join(OUT, `${h.slug}.json`))))
  .sort((a, b) => prio(a) - prio(b) || b.offers - a.offers || b.rating - a.rating)
  .slice(0, LIMIT);
console.log('Do opisania:', todo.length);

// praca równoległa: CONC hoteli naraz (płatne Gemini ma wysokie limity zapytań na minutę)
const CONC = Number(process.env.HOTEL_CONC || 6);
let ok = 0;
async function one(h) {
  try {
    const r = await research(h);
    if (!r.text || /NIE ZNALEZIONO/.test(r.text) || r.text.length < 300) { index[h.id].failed = true; console.log('pomijam (brak danych):', h.name); return; }
    const d = await write(h, r.text);
    if (!d.found || !Array.isArray(d.intro) || d.intro.join(' ').length < 300) { index[h.id].failed = true; console.log('pomijam (niepewne):', h.name); return; }
    const webGeo = typeof d.lat === 'number' && typeof d.lon === 'number' && Math.abs(d.lat) <= 90 && Math.abs(d.lon) <= 180 && (d.lat !== 0 || d.lon !== 0) ? { lat: d.lat, lon: d.lon, src: 'web' } : null;
    const geo = await geocode(h, d.city) || webGeo;
    const out = {
      id: h.id, slug: h.slug, name: h.name, country: h.country, place: h.place, stars: h.stars, photo: h.photo,
      ...d, geo, sources: r.sources, updated: new Date().toISOString().slice(0, 10),
    };
    delete out.found; delete out.lat; delete out.lon;
    fs.writeFileSync(path.join(OUT, `${h.slug}.json`), JSON.stringify(clean(out), null, 1));
    ok++;
    console.log(`OK ${ok}/${todo.length}:`, h.name);
  } catch (e) {
    console.log('błąd:', h.name, e.message);
    await sleep(5000);
  }
}

let next = 0;
await Promise.all(Array.from({ length: Math.min(CONC, todo.length) }, async () => {
  while (next < todo.length) await one(todo[next++]);
}));
fs.writeFileSync(indexFile, JSON.stringify(index));
console.log('Gotowe, nowych kart:', ok);
