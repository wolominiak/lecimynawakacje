// Generuje przewodniki dla krajów, które nie mają jeszcze pliku w content/countries/.
// Użycie:
//   GEMINI_API_KEY=xxx node scripts/generate-content.mjs --limit 20
//   GEMINI_API_KEY=xxx node scripts/generate-content.mjs --only islandia,norwegia --force
// Opcje: --limit N (domyślnie 15), --only slug1,slug2, --force (nadpisz istniejące), --model nazwa
// Pliki ręczne (source: "manual") nigdy nie są nadpisywane.

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf('--' + name);
  if (i === -1) return def;
  const v = args[i + 1];
  return v && !v.startsWith('--') ? v : true;
};

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error('Brak GEMINI_API_KEY'); process.exit(1); }
const MODEL = arg('model', process.env.GEMINI_MODEL || 'gemini-2.5-flash');
const LIMIT = Number(arg('limit', 15));
const ONLY = typeof arg('only') === 'string' ? arg('only').split(',') : null;
const FORCE = !!arg('force', false);

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const countries = JSON.parse(fs.readFileSync(path.join(root, 'data/countries.json'), 'utf8'));
const dir = path.join(root, 'content/countries');
fs.mkdirSync(dir, { recursive: true });

const exists = (slug) => fs.existsSync(path.join(dir, slug + '.json'));
const isManual = (slug) => exists(slug) && JSON.parse(fs.readFileSync(path.join(dir, slug + '.json'), 'utf8')).source === 'manual';

let queue = countries.filter((c) => (ONLY ? ONLY.includes(c.slug) : true)).filter((c) => !isManual(c.slug)).filter((c) => FORCE || !exists(c.slug));
queue = queue.slice(0, LIMIT);
console.log(`Model: ${MODEL}, do wygenerowania: ${queue.length}`);

const SCHEMA_HINT = `{
  "slug": "<slug>",
  "loc": "miejscownik z przyimkiem, np. 'w Grecji', 'na Malcie', 'na Islandii'",
  "to": "kierunek, np. 'do Grecji', 'na Maltę'",
  "capital": "stolica po polsku",
  "popularity": "liczba 1-60: jak popularny jest kraj wśród polskich turystów (60 = bardzo, 5 = prawie wcale)",
  "touroperator": "true jeśli polskie biura podróży (Itaka, Rainbow, TUI, Coral) mają ten kraj w ofercie wczasów samolotem, inaczej false",
  "gygQuery": "fraza do wyszukania wycieczek w GetYourGuide, zwykle nazwa kraju lub głównego miasta po angielsku",
  "teaser": "1-2 zdania zachęty, maks 160 znaków",
  "intro": ["3 akapity po 4-6 zdań: czym kraj przyciąga, dla kogo jest, jak wygląda podróż z Polski"],
  "highlights": ["6 krótkich punktów, maks 70 znaków każdy"],
  "bestTime": { "text": "akapit o najlepszym terminie", "best": [numery najlepszych miesięcy 1-12], "ok": [numery dobrych miesięcy] },
  "climate": { "air": [12 liczb: średnia maks. temperatura dzienna, styczeń-grudzień], "sea": [12 liczb lub null gdy brak morza], "note": "dla jakiego miasta są dane" },
  "practical": { "flight": "czas lotu z Polski, np. 'około 4 h' lub 'około 12 h z przesiadką'", "timeDiff": "różnica czasu do Polski", "documents": "dokumenty i wizy dla obywateli Polski, ostrożnie, z zaleceniem sprawdzenia przed wyjazdem", "money": "waluta i płatności", "plugs": "typy gniazdek", "language": "języki", "safety": "bezpieczeństwo i zdrowie" },
  "regions": [ 2-6 najważniejszych regionów, wysp lub miast turystycznych: { "slug": "slug-bez-polskich-znakow", "name": "nazwa", "loc": "miejscownik z przyimkiem", "type": "wyspa/miasto/region/kurort/park narodowy", "gygQuery": "fraza po angielsku", "airport": "najbliższe lotnisko z kodem IATA", "forWhom": "1 zdanie", "intro": ["2 akapity po 3-4 zdania"], "highlights": ["4 krótkie punkty"] } ],
  "attractions": [ 6-8 atrakcji: { "name": "nazwa", "text": "1-2 zdania", "gygQuery": "fraza po angielsku" } ],
  "cuisine": ["1 akapit o kuchni"],
  "faq": [ 3-5 pytań: { "q": "pytanie, jakie wpisuje Polak w Google", "a": "konkretna odpowiedź 1-3 zdania" } ]
}`;

function prompt(c) {
  return `Jesteś autorem polskiego portalu turystycznego lecimynawakacje.pl. Napisz przewodnik po kraju: ${c.name} (kod ${c.code}, kontynent: ${c.continent}, waluta: ${c.currencies.map((x) => x.code).join(', ')}, języki: ${c.languages.join(', ')}).

Zasady:
- Pisz po polsku, naturalnie, konkretnie, jak doświadczony podróżnik. Bez marketingowego patosu, bez zwrotów typu "raj na ziemi", "niezapomniane wrażenia", "magiczny".
- NIGDY nie używaj długich myślników (— ani –). Używaj przecinków, kropek lub zwykłego łącznika "-".
- Pisz z perspektywy turysty z Polski (loty z Polski, dokumenty dla Polaków, różnica czasu względem Polski).
- Nie wymyślaj faktów. Jeśli kraj jest mało turystyczny lub niebezpieczny, napisz to wprost i uczciwie.
- Dla krajów bez dostępu do morza ustaw "sea": null.
- Slug kraju to "${c.slug}".

Zwróć wyłącznie JSON zgodny z tym wzorem:
${SCHEMA_HINT}`;
}

const clean = (v) => typeof v === 'string' ? v.replace(/\s*[–—]\s*/g, ' - ').replace(/\s{2,}/g, ' ').trim()
  : Array.isArray(v) ? v.map(clean)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)]))
  : v;

function validate(d, c) {
  if (!Array.isArray(d.intro) || d.intro.join(' ').length < 400) throw new Error('za krótkie intro');
  if (!d.loc || !d.to || !d.teaser) throw new Error('brak loc/to/teaser');
  if (d.climate && (!Array.isArray(d.climate.air) || d.climate.air.length !== 12)) delete d.climate;
  if (d.climate?.sea && d.climate.sea.length !== 12) d.climate.sea = null;
  if (!d.climate) delete d.bestTime;
  d.slug = c.slug;
  d.popularity = Math.max(1, Math.min(60, Number(d.popularity) || 10));
  d.touroperator = d.touroperator === true || d.touroperator === 'true';
  d.regions = (d.regions || []).filter((r) => r.slug && r.name && r.intro?.length).map((r) => ({
    ...r,
    slug: r.slug.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  })).filter((r) => !['kiedy-jechac', 'all-inclusive', 'atrakcje'].includes(r.slug));
  d.source = 'gemini';
  d.updated = new Date().toISOString().slice(0, 10);
  return d;
}

async function gen(c) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt(c) }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.6 },
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  return validate(clean(JSON.parse(text)), c);
}

let ok = 0;
for (const c of queue) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const d = await gen(c);
      fs.writeFileSync(path.join(dir, c.slug + '.json'), JSON.stringify(d, null, 2) + '\n');
      console.log(`OK  ${c.slug} (${d.regions.length} regionów)`);
      ok++;
      break;
    } catch (e) {
      console.warn(`ERR ${c.slug} próba ${attempt}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
  await new Promise((r) => setTimeout(r, 1200));
}
console.log(`Gotowe: ${ok}/${queue.length}`);
