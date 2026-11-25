// Szczegółowe opisy atrakcji (Gemini) + numer wycieczki GetYourGuide do widgetu dostępności.
//   GEMINI_API_KEY=xxx node scripts/generate-attractions.mjs --limit 100
//   GEMINI_API_KEY=xxx node scripts/generate-attractions.mjs --only grecja --force
// Wynik: content/attractions/<kraj>/<slug>.json. Kolejność: kraje od najpopularniejszych.
// Opcje: --limit N (domyślnie 100), --only kraj1,kraj2, --force, --model nazwa, --tours-only (tylko szukanie tour-id)
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const LIMIT = Number(arg('limit', '100'));
const ONLY = (arg('only', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const FORCE = args.includes('--force');
const TOURS_ONLY = args.includes('--tours-only');
const KEY = process.env.GEMINI_API_KEY;
if (!KEY && !TOURS_ONLY) { console.error('Brak GEMINI_API_KEY'); process.exit(1); }
const MODEL = arg('model', process.env.GEMINI_MODEL || 'gemini-2.5-flash');
const GYG_PARTNER = 'JIO7LWL';

const root = process.cwd();
const outDir = path.join(root, 'content', 'attractions');
const countries = JSON.parse(fs.readFileSync(path.join(root, 'data', 'countries.json'), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const slugify = (s) => s.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' i ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);

// Kolejka: kraje od najpopularniejszych, w kraju atrakcje w kolejności z przewodnika
const queue = [];
const loaded = countries.map((c) => {
  try { return { c, ct: JSON.parse(fs.readFileSync(path.join(root, 'content', 'countries', c.slug + '.json'), 'utf8')) }; } catch { return null; }
}).filter(Boolean).sort((a, b) => (b.ct.popularity || 0) - (a.ct.popularity || 0));
for (const { c, ct } of loaded) {
  if (ONLY.length && !ONLY.includes(c.slug)) continue;
  const seen = new Set();
  for (const a of Array.isArray(ct.attractions) ? ct.attractions : []) {
    if (!a?.name) continue;
    const slug = slugify(a.name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    const file = path.join(outDir, c.slug, slug + '.json');
    const exists = fs.existsSync(file);
    if (TOURS_ONLY) { if (exists) queue.push({ c, ct, a, slug, file }); continue; }
    if (exists && !FORCE) continue;
    queue.push({ c, ct, a, slug, file });
  }
}

const S = { type: 'STRING' };
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    lead: S,
    intro: { type: 'ARRAY', items: S },
    history: S,
    highlights: { type: 'ARRAY', items: { type: 'OBJECT', properties: { name: S, text: S }, required: ['name', 'text'] } },
    visitTime: S,
    bestTime: S,
    gettingThere: S,
    tickets: S,
    tips: { type: 'ARRAY', items: S },
    forWhom: S,
    faq: { type: 'ARRAY', items: { type: 'OBJECT', properties: { q: S, a: S }, required: ['q', 'a'] } },
    gygQuery: S,
  },
  required: ['lead', 'intro', 'highlights', 'visitTime', 'bestTime', 'gettingThere', 'tickets', 'tips', 'faq', 'gygQuery'],
};

function prompt({ c, ct, a }) {
  const others = (ct.attractions || []).filter((x) => x.name !== a.name).slice(0, 8).map((x) => x.name).join(', ');
  return `Jesteś doświadczonym autorem przewodników turystycznych dla Polaków. Napisz szczegółowy, rzetelny opis atrakcji "${a.name}" (kraj: ${c.name}) na stronę polskiego portalu turystycznego.
Krótki opis z przewodnika: ${a.text || ''}
Inne atrakcje w tym kraju (możesz wspomnieć, co warto połączyć): ${others}

Zasady:
- Po polsku, naturalnie, konkretnie, jak doświadczony przewodnik. Bez marketingowego zachwytu i bez ogólników typu "niezapomniane wrażenia".
- NIGDY nie używaj długich myślników (znaków \u2014 ani \u2013). Używaj przecinków, dwukropków albo zwykłego "-".
- Pisz tylko to, czego jesteś pewien. Nie podawaj dokładnych cen biletów ani godzin otwarcia, bo się zmieniają: opisz ogólnie (np. "bilet jest płatny, taniej kupisz go online", "latem otwarte dłużej") i zaznacz, że aktualne informacje są na oficjalnej stronie.
- lead: 1-2 zdania zachęty, czym jest to miejsce i dlaczego warto (do 220 znaków).
- intro: 3 akapity po 3-5 zdań: czym jest atrakcja, co się tam robi, jakie robi wrażenie.
- history: 1 akapit o historii lub pochodzeniu (jeśli to przyroda, to o powstaniu); pusty, jeśli nic sensownego.
- highlights: 4-6 konkretnych rzeczy do zobaczenia lub zrobienia na miejscu, każda z 1-2 zdaniami opisu.
- visitTime: ile czasu zarezerwować (np. "2-3 godziny, z wejściem na punkt widokowy pół dnia").
- bestTime: kiedy najlepiej przyjechać (pora roku i dnia, jak uniknąć tłumów).
- gettingThere: jak dojechać (z najbliższego miasta lub kurortu, samochodem, komunikacją, z wycieczką).
- tickets: jak kupić bilety lub wycieczkę, czy warto z przewodnikiem, czy rezerwować wcześniej.
- tips: 4-6 praktycznych porad (strój, buty, woda, zdjęcia, zasady).
- forWhom: dla kogo to miejsce (rodziny z dziećmi, miłośnicy historii itd.), 1-2 zdania.
- faq: 4 pytania i odpowiedzi, które Polacy wpisują w Google o tę atrakcję (np. "Czy warto...", "Ile trwa zwiedzanie...", "Jak dojechać...").
- gygQuery: krótka angielska fraza do wyszukania wycieczek do tej atrakcji na GetYourGuide (np. "Knossos Palace").
Zwróć wyłącznie JSON.`;
}

function parseLoose(text) {
  let t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try { return JSON.parse(t); } catch {}
  const a = t.indexOf('{'); const b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t.replace(/,\s*([}\]])/g, '$1'));
}
// Bez długich myślników w całym JSON-ie
const clean = (v) => typeof v === 'string' ? v.replace(/\s*[\u2013\u2014]\s*/g, ' - ').trim()
  : Array.isArray(v) ? v.map(clean) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)])) : v;
const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

async function gen(job) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt(job) }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA, temperature: 0.5, maxOutputTokens: 8192, thinkingConfig: { thinkingBudget: 0 } },
    }),
  });
  if (res.status === 429) { await sleep(30000); throw new Error('429 limit, czekam'); }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  const cand = j.candidates?.[0];
  if (cand?.finishReason === 'MAX_TOKENS') throw new Error('odpowiedź ucięta');
  const d = clean(parseLoose(cand?.content?.parts?.map((p) => p.text).join('') || ''));
  d.intro = arr(d.intro).filter(Boolean);
  d.highlights = arr(d.highlights).filter((x) => x?.name);
  d.tips = arr(d.tips).filter(Boolean);
  d.faq = arr(d.faq).filter((x) => x?.q && x?.a);
  if (d.intro.length < 2 || d.intro.join(' ').length < 500 || d.highlights.length < 3) throw new Error('za krótka treść');
  return d;
}

// Numer wycieczki GetYourGuide (do widgetu dostępności). Najpopularniejsza wycieczka z wyszukiwania.
async function findTour(q) {
  const tries = [
    `https://widget.getyourguide.com/default/activities.frame?locale_code=pl-PL&widget=activities&number_of_items=3&partner_id=${GYG_PARTNER}&currency=PLN&q=${encodeURIComponent(q)}`,
    `https://www.getyourguide.com/s/?q=${encodeURIComponent(q)}&searchSource=3`,
  ];
  for (const u of tries) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; lecimynawakacje-bot/1.0; +https://lecimynawakacje.pl)', 'Accept-Language': 'pl-PL,pl;q=0.9' } });
      if (!r.ok) continue;
      const h = await r.text();
      const m = h.match(/-t(\d{4,7})(?:[/?"'\\]|$)/) || h.match(/"tour_?[iI]d"\s*:\s*"?(\d{4,7})/);
      if (m) return Number(m[1]);
    } catch {}
  }
  return null;
}

let ok = 0, tours = 0, done = 0;
console.log(`Do zrobienia: ${queue.length} atrakcji (limit ${LIMIT})`);
for (const job of queue) {
  if (done >= LIMIT) break;
  done++;
  let d = null;
  if (TOURS_ONLY) {
    d = JSON.parse(fs.readFileSync(job.file, 'utf8'));
    if (d.gygTourId && !FORCE) continue;
  } else {
    for (let attempt = 1; attempt <= 3 && !d; attempt++) {
      try { d = await gen(job); } catch (e) { console.warn(`ERR ${job.c.slug}/${job.slug} próba ${attempt}: ${e.message}`); await sleep(3000 * attempt); }
    }
    if (!d) continue;
    d = { name: job.a.name, slug: job.slug, country: job.c.slug, ...d, gygQuery: d.gygQuery || job.a.gygQuery || job.a.name };
  }
  const id = await findTour(d.gygQuery || job.a.gygQuery || job.a.name);
  if (id) { d.gygTourId = id; tours++; }
  fs.mkdirSync(path.dirname(job.file), { recursive: true });
  fs.writeFileSync(job.file, JSON.stringify(d, null, 2) + '\n');
  ok++;
  console.log(`OK  ${job.c.slug}/${job.slug}${id ? ` (wycieczka GYG ${id})` : ''}`);
  await sleep(1000);
}
console.log(`Gotowe: ${ok} zapisanych, z numerem wycieczki GYG: ${tours}. Zostało: ${Math.max(0, queue.length - done)}.`);
if (done && ok === 0) { console.error('Nic się nie udało, sprawdź błędy powyżej.'); process.exit(1); }
