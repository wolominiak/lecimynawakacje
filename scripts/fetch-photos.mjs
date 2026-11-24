// Pobiera zdjęcia krajów i regionów z Pixabay (albo Pexels), zmniejsza do WebP i zapisuje w public/img.
// Uruchamiane z GitHub Actions (sekret PIXABAY_API_KEY, ewentualnie PEXELS_API_KEY).
//   node scripts/fetch-photos.mjs [--limit 2000] [--only grecja,grecja-kreta] [--scope countries|regions|all] [--force]
// Pliki:
//   public/img/<klucz>.webp     1280x640, nagłówek strony
//   public/img/s/<klucz>.webp   560x420, kafelek
//   data/photos.json            autor, źródło i link do zdjęcia
// Klucz kraju = <slug>, regionu = <kraj>-<region>.
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PIXABAY = process.env.PIXABAY_API_KEY;
const PEXELS = process.env.PEXELS_API_KEY;
if (!PIXABAY && !PEXELS) { console.error('Brak PIXABAY_API_KEY (lub PEXELS_API_KEY)'); process.exit(1); }
const SOURCE = PIXABAY ? 'Pixabay' : 'Pexels';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const LIMIT = Number(arg('limit', PIXABAY ? '2000' : '180'));
const ONLY = (arg('only', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const SCOPE = arg('scope', 'all');
const FORCE = args.includes('--force');

const root = process.cwd();
const IMG = path.join(root, 'public', 'img');
const SMALL = path.join(IMG, 's');
fs.mkdirSync(SMALL, { recursive: true });
const metaFile = path.join(root, 'data', 'photos.json');
const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {};
const usedIds = new Set(Object.values(meta).map((m) => String(m.id)));

const countries = JSON.parse(fs.readFileSync(path.join(root, 'data', 'countries.json'), 'utf8'));
const en = new Intl.DisplayNames(['en'], { type: 'region' });
const enName = (c) => { try { return en.of(c.code) || c.name; } catch { return c.name; } };
const content = (slug) => {
  try { return JSON.parse(fs.readFileSync(path.join(root, 'content', 'countries', slug + '.json'), 'utf8')); } catch { return null; }
};

// Zadania: najpierw kraje (wg popularności), potem regiony
const jobs = [];
const withPop = countries.map((c) => ({ c, ct: content(c.slug) })).sort((a, b) => (b.ct?.popularity || 0) - (a.ct?.popularity || 0));
if (SCOPE !== 'regions') {
  for (const { c } of withPop) {
    const n = enName(c);
    jobs.push({ key: c.slug, queries: [{ q: n, lang: 'en', travel: true }, { q: n, lang: 'en' }, { q: c.name, lang: 'pl' }] });
  }
}
if (SCOPE !== 'countries') {
  for (const { c, ct } of withPop) {
    const n = enName(c);
    for (const r of ct?.regions || []) {
      if (!r?.slug || !r?.name) continue;
      jobs.push({ key: `${c.slug}-${r.slug}`, queries: [{ q: `${r.name} ${n}`, lang: 'en' }, { q: `${r.name} ${c.name}`, lang: 'pl' }, { q: r.name, lang: 'pl' }] });
    }
  }
}

const BAD = /\b(flag|map|passport|banknote|money|currency|coin|stamp|portrait|selfie|logo|text|document|globe|mask|covid|weapon|gun|soldier|army|war|protest|woman|man|girl|boy|model|fashion)\b/i;

// Wspólny format wyniku: { id, width, alt, by, url, src }
async function pixabay(q, lang, travel) {
  const u = `https://pixabay.com/api/?key=${PIXABAY}&q=${encodeURIComponent(q.slice(0, 100))}&lang=${lang}&image_type=photo&orientation=horizontal&safesearch=true&min_width=1200&per_page=30&order=popular${travel ? '&category=travel' : ''}`;
  await sleep(700); // limit 100 zapytań na minutę
  const r = await fetch(u);
  if (r.status === 429) { console.log('429, czekam minutę'); await sleep(61000); return pixabay(q, lang, travel); }
  if (!r.ok) throw new Error(`Pixabay HTTP ${r.status}: ${(await r.text()).slice(0, 120)}`);
  const rem = r.headers.get('x-ratelimit-remaining');
  if (rem != null && Number(rem) < 3) await sleep(60000);
  return ((await r.json()).hits || []).map((h) => ({ id: 'pb' + h.id, width: h.imageWidth, alt: h.tags, by: h.user, url: h.pageURL, src: h.largeImageURL }));
}

let pexelsLeft = 200;
async function pexels(q, lang) {
  const u = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=landscape&size=large&per_page=20&locale=${lang === 'pl' ? 'pl-PL' : 'en-US'}`;
  const r = await fetch(u, { headers: { Authorization: PEXELS } });
  const rem = r.headers.get('x-ratelimit-remaining');
  if (rem != null) pexelsLeft = Number(rem);
  if (r.status === 429) { pexelsLeft = 0; return null; }
  if (!r.ok) throw new Error(`Pexels HTTP ${r.status}`);
  return ((await r.json()).photos || []).map((p) => ({ id: String(p.id), width: p.width, alt: p.alt, by: p.photographer, url: p.url, src: p.src.original + '?auto=compress&w=1800' }));
}

const clean = (s) => String(s || '').replace(/[–—]/g, '-').trim();

let done = 0, ok = 0;
for (const job of jobs) {
  if (done >= LIMIT) break;
  if (ONLY.length && !ONLY.includes(job.key)) continue;
  const big = path.join(IMG, job.key + '.webp');
  if (!FORCE && fs.existsSync(big)) continue;
  if (!PIXABAY && pexelsLeft < 3) { console.log('Limit Pexels na tę godzinę wyczerpany, reszta przy następnym uruchomieniu.'); break; }

  let pick = null;
  try {
    for (const { q, lang, travel } of job.queries) {
      if (travel && !PIXABAY) continue;
      const photos = PIXABAY ? await pixabay(q, lang, travel) : await pexels(q, lang);
      if (photos == null) break;
      pick = photos.find((p) => !usedIds.has(String(p.id)) && p.width >= 1200 && !BAD.test(p.alt || ''));
      if (pick) break;
    }
  } catch (e) {
    console.log(`ERR ${job.key}: ${e.message}`);
    if (/HTTP 40[13]/.test(e.message)) { console.log('Zły klucz API, przerywam.'); break; }
  }
  done++;
  if (!pick) { console.log(`-  ${job.key}: brak pasującego zdjęcia`); continue; }

  try {
    const r = await fetch(pick.src);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    await sharp(buf).resize(1280, 640, { fit: 'cover', position: 'attention' }).webp({ quality: 66 }).toFile(big);
    await sharp(buf).resize(560, 420, { fit: 'cover', position: 'attention' }).webp({ quality: 64 }).toFile(path.join(SMALL, job.key + '.webp'));
    meta[job.key] = { id: pick.id, by: clean(pick.by), url: pick.url, alt: clean(pick.alt), src: SOURCE };
    usedIds.add(String(pick.id));
    ok++;
    console.log(`OK ${job.key}: ${clean(pick.alt).slice(0, 70)} (fot. ${clean(pick.by)})`);
  } catch (e) {
    console.log(`ERR ${job.key}: ${e.message}`);
  }
}

const sorted = Object.fromEntries(Object.keys(meta).sort().map((k) => [k, meta[k]]));
fs.writeFileSync(metaFile, JSON.stringify(sorted, null, 1) + '\n');
const missing = jobs.filter((j) => !fs.existsSync(path.join(IMG, j.key + '.webp'))).length;
console.log(`Gotowe (${SOURCE}): ${ok} nowych zdjęć, brakuje jeszcze ${missing}.`);
