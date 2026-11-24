// Pobiera zdjęcia krajów i regionów z Pexels, zmniejsza do WebP i zapisuje w public/img.
// Uruchamiane z GitHub Actions (sekret PEXELS_API_KEY).
//   node scripts/fetch-photos.mjs [--limit 180] [--only grecja,kreta] [--scope countries|regions|all] [--force]
// Pliki:
//   public/img/<klucz>.webp     1400x700, nagłówek strony
//   public/img/s/<klucz>.webp   560x420, kafelek
//   data/photos.json            autor i link do zdjęcia
// Klucz kraju = <slug>, regionu = <kraj>-<region>.
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const KEY = process.env.PEXELS_API_KEY;
if (!KEY) { console.error('Brak PEXELS_API_KEY'); process.exit(1); }

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const LIMIT = Number(arg('limit', '180'));
const ONLY = (arg('only', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const SCOPE = arg('scope', 'all');
const FORCE = args.includes('--force');

const root = process.cwd();
const IMG = path.join(root, 'public', 'img');
const SMALL = path.join(IMG, 's');
fs.mkdirSync(SMALL, { recursive: true });
const metaFile = path.join(root, 'data', 'photos.json');
const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {};
const usedIds = new Set(Object.values(meta).map((m) => m.id));

const countries = JSON.parse(fs.readFileSync(path.join(root, 'data', 'countries.json'), 'utf8'));
const en = new Intl.DisplayNames(['en'], { type: 'region' });
const content = (slug) => {
  const f = path.join(root, 'content', 'countries', slug + '.json');
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
};

// Lista zadań: najpierw kraje (wg popularności), potem regiony
const jobs = [];
const withPop = countries.map((c) => ({ c, ct: content(c.slug) })).sort((a, b) => (b.ct?.popularity || 0) - (a.ct?.popularity || 0));
if (SCOPE !== 'regions') {
  for (const { c } of withPop) {
    let name = c.name;
    try { name = en.of(c.code) || c.name; } catch {}
    jobs.push({ key: c.slug, queries: [{ q: name, locale: 'en-US' }, { q: c.name, locale: 'pl-PL' }] });
  }
}
if (SCOPE !== 'countries') {
  for (const { c, ct } of withPop) {
    let cen = c.name;
    try { cen = en.of(c.code) || c.name; } catch {}
    for (const r of ct?.regions || []) {
      if (!r?.slug || !r?.name) continue;
      jobs.push({ key: `${c.slug}-${r.slug}`, queries: [{ q: `${r.name} ${cen}`, locale: 'en-US' }, { q: r.name, locale: 'pl-PL' }] });
    }
  }
}

const BAD = /\b(flag|map|passport|banknote|money|currency|coin|stamp|portrait|selfie|logo|text|sign|document|globe|mask|covid|weapon|gun|soldier|army|war|protest)\b/i;
let remaining = 200;

async function search(q, locale) {
  const u = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=landscape&size=large&per_page=20&locale=${locale}`;
  const r = await fetch(u, { headers: { Authorization: KEY } });
  const rem = r.headers.get('x-ratelimit-remaining');
  if (rem != null) remaining = Number(rem);
  if (r.status === 429) { remaining = 0; return null; }
  if (!r.ok) throw new Error(`Pexels HTTP ${r.status}`);
  return (await r.json()).photos || [];
}

const clean = (s) => String(s || '').replace(/[–—]/g, '-').trim();

let done = 0;
for (const job of jobs) {
  if (done >= LIMIT) break;
  if (ONLY.length && !ONLY.some((o) => job.key === o || job.key.startsWith(o + '-'))) continue;
  const big = path.join(IMG, job.key + '.webp');
  if (!FORCE && fs.existsSync(big)) continue;
  if (remaining < 3) { console.log('Limit zapytań Pexels na tę godzinę wyczerpany, reszta przy następnym uruchomieniu.'); break; }

  let pick = null;
  for (const { q, locale } of job.queries) {
    const photos = await search(q, locale);
    if (photos == null) break;
    pick = photos.find((p) => !usedIds.has(p.id) && p.width >= 1400 && !BAD.test(p.alt || ''));
    if (pick) break;
    if (remaining < 3) break;
  }
  done++;
  if (!pick) { console.log(`-  ${job.key}: brak pasującego zdjęcia`); continue; }

  try {
    const r = await fetch(pick.src.original + '?auto=compress&w=1800');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    await sharp(buf).resize(1400, 700, { fit: 'cover', position: 'attention' }).webp({ quality: 66 }).toFile(big);
    await sharp(buf).resize(560, 420, { fit: 'cover', position: 'attention' }).webp({ quality: 64 }).toFile(path.join(SMALL, job.key + '.webp'));
    meta[job.key] = { id: pick.id, by: clean(pick.photographer), url: pick.url, alt: clean(pick.alt) };
    usedIds.add(pick.id);
    console.log(`OK ${job.key}: ${clean(pick.alt).slice(0, 70)} (fot. ${clean(pick.photographer)})`);
  } catch (e) {
    console.log(`ERR ${job.key}: ${e.message}`);
  }
}

const sorted = Object.fromEntries(Object.keys(meta).sort().map((k) => [k, meta[k]]));
fs.writeFileSync(metaFile, JSON.stringify(sorted, null, 1) + '\n');
const missing = jobs.filter((j) => !fs.existsSync(path.join(IMG, j.key + '.webp'))).length;
console.log(`Gotowe: ${done} zapytań w tej rundzie, brakuje jeszcze ${missing} zdjęć.`);
