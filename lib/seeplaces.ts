import fs from 'fs';
import path from 'path';

// Wycieczki SeePlaces (po polsku) z feedu TradeDoublera: public/seeplaces/<kraj>.json (import: scripts/import-seeplaces.mjs)
export type SpTour = { id: string; n: string; d: string; img: string; p: number; op: number; cat: string; r: string; best: number; u: string };
const dir = path.join(process.cwd(), 'public', 'seeplaces');
const cache = new Map<string, SpTour[]>();

export function spTours(kraj: string): SpTour[] {
  if (cache.has(kraj)) return cache.get(kraj)!;
  let l: SpTour[] = [];
  try { l = JSON.parse(fs.readFileSync(path.join(dir, kraj + '.json'), 'utf8')); } catch {}
  cache.set(kraj, l);
  return l;
}

const norm = (s: string) => ' ' + s.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim() + ' ';

/** Wycieczki dla miejsca: najpierw pasujące do frazy (atrakcja), potem regionu, na końcu z całego kraju */
export function spFor(kraj: string, opts: { region?: string; phrase?: string; limit?: number } = {}): SpTour[] {
  const all = spTours(kraj);
  const lim = opts.limit || 6;
  const out: SpTour[] = [];
  const push = (l: SpTour[]) => { for (const t of l) if (out.length < lim && !out.includes(t)) out.push(t); };
  if (opts.phrase) {
    const words = norm(opts.phrase).trim().split(' ').filter((w) => w.length >= 5).map((w) => w.slice(0, Math.max(5, w.length - 2)));
    if (words.length) push(all.filter((t) => { const n = norm(t.n + ' ' + t.d); return words.some((w) => n.includes(' ' + w)); }));
  }
  if (opts.region) push(all.filter((t) => t.r === opts.region));
  else push(all);
  return out;
}
