import fs from 'fs';
import path from 'path';

let idx: Record<string, number> | null = null;
/** Liczba ofert Exim dla kraju (z public/exim/index.json tworzonego przez import) */
export function eximCount(slug: string): number {
  if (!idx) {
    const f = path.join(process.cwd(), 'public', 'exim', 'index.json');
    idx = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
  }
  return idx![slug] || 0;
}
