import fs from 'fs';
import path from 'path';
import photos from '@/data/photos.json';

// Zdjęcia: public/img/<klucz>.webp (nagłówek) i public/img/s/<klucz>.webp (kafelek).
// Klucz kraju = <slug>, regionu = <kraj>-<region>. Pobiera je workflow "Pobierz zdjęcia" (Pexels).
// Można też wrzucić własne pliki .jpg/.webp o tych nazwach. Bez zdjęcia wyświetla się kontur kraju.
const dir = path.join(process.cwd(), 'public', 'img');
let files: Set<string> | null = null;
let small: Set<string> | null = null;
const list = (d: string) => new Set(fs.existsSync(d) ? fs.readdirSync(d) : []);

export function imageFor(key: string, size: 'large' | 'small' = 'large'): string | null {
  if (!files) { files = list(dir); small = list(path.join(dir, 's')); }
  if (size === 'small' && small!.has(`${key}.webp`)) return `/img/s/${key}.webp`;
  for (const ext of ['webp', 'jpg', 'jpeg', 'png']) {
    if (files.has(`${key}.${ext}`)) return `/img/${key}.${ext}`;
  }
  return null;
}

export function photoCredit(key: string): { by: string; url: string; alt: string } | null {
  return (photos as Record<string, { by: string; url: string; alt: string }>)[key] || null;
}
