import fs from 'fs';
import path from 'path';
import type { Country } from './types';

// Szczegółowe strony atrakcji: content/attractions/<kraj>/<slug>.json (generator: scripts/generate-attractions.mjs)
export type AttractionPage = {
  name: string; slug: string; country: string;
  lead: string; intro: string[]; history?: string;
  highlights: { name: string; text: string }[];
  visitTime: string; bestTime: string; gettingThere: string; tickets: string;
  tips: string[]; forWhom?: string; faq: { q: string; a: string }[];
  gygQuery: string; gygTourId?: number;
};

export const attractionSlug = (s: string) => s.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' i ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);

const dir = path.join(process.cwd(), 'content', 'attractions');
const cache = new Map<string, AttractionPage[]>();

export function attractionsOf(kraj: string): AttractionPage[] {
  if (cache.has(kraj)) return cache.get(kraj)!;
  const d = path.join(dir, kraj);
  const list: AttractionPage[] = fs.existsSync(d) && fs.statSync(d).isDirectory()
    ? fs.readdirSync(d).filter((f) => f.endsWith('.json')).map((f) => { try { return JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')); } catch { return null; } }).filter((x) => x?.intro?.length)
    : [];
  cache.set(kraj, list);
  return list;
}

export function getAttraction(kraj: string, slug: string) {
  return attractionsOf(kraj).find((a) => a.slug === slug);
}

/** Link do strony atrakcji, jeśli jest opis; w przeciwnym razie null */
export function attractionUrl(c: Country, name: string): string | null {
  const s = attractionSlug(name);
  return getAttraction(c.slug, s) ? `/wakacje/${c.slug}/atrakcje/${s}/` : null;
}

export function allAttractionPages(): { kraj: string; slug: string }[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).flatMap((e) => attractionsOf(e.name).map((a) => ({ kraj: e.name, slug: a.slug })));
}
