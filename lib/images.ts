import fs from 'fs';
import path from 'path';

// Zdjęcia: wrzuć plik do public/img/<slug>.jpg (kraj) lub public/img/<kraj>-<region>.jpg (region).
// Strona automatycznie go użyje w nagłówku i na kartach. Bez zdjęcia wyświetla się kontur kraju.
const dir = path.join(process.cwd(), 'public', 'img');
let files: Set<string> | null = null;

export function imageFor(key: string): string | null {
  if (!files) files = new Set(fs.existsSync(dir) ? fs.readdirSync(dir) : []);
  for (const ext of ['webp', 'jpg', 'jpeg', 'png']) {
    if (files.has(`${key}.${ext}`)) return `/img/${key}.${ext}`;
  }
  return null;
}
