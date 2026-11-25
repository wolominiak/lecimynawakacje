import type { Metadata } from 'next';
import { SITE } from './affiliate';
import { imageFor } from './images';

// Jedno miejsce na reguły SEO: długość tytułu i opisu, canonical, Open Graph, Twitter.
const BRAND = ' | Lecimy na wakacje';
const TITLE_MAX = 62; // Google ucina ok. 580 px, czyli ok. 60 znaków
const DESC_MAX = 158;

/** Ucina tekst na granicy słowa */
export function clip(s: string, max: number) {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const i = cut.lastIndexOf(' ');
  return (i > max * 0.6 ? cut.slice(0, i) : cut).replace(/[,;:.\s-]+$/, '') + '…';
}

/** Marka w tytule tylko wtedy, gdy się mieści */
export function fullTitle(t: string) {
  const s = t.replace(/\s+/g, ' ').trim();
  return s.length + BRAND.length <= TITLE_MAX ? s + BRAND : s;
}

type SeoIn = { title: string; description: string; path: string; image?: string | null; noindex?: boolean; type?: 'website' | 'article' };

export function seo({ title, description, path, image, noindex, type = 'website' }: SeoIn): Metadata {
  const t = fullTitle(title);
  const d = clip(description, DESC_MAX);
  const img = image || '/og.jpg';
  const images = [{ url: img, width: img === '/og.jpg' ? 1200 : 1280, height: img === '/og.jpg' ? 630 : 640, alt: title }];
  return {
    title: { absolute: t },
    description: d,
    alternates: { canonical: path },
    openGraph: { title: t, description: d, url: path, siteName: SITE.name, locale: 'pl_PL', type, images },
    twitter: { card: 'summary_large_image', title: t, description: d, images: [img] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Zdjęcie do Open Graph: najpierw region, potem kraj */
export const ogImage = (...keys: (string | undefined)[]) => {
  for (const k of keys) { if (!k) continue; const i = imageFor(k); if (i) return i; }
  return null;
};

/** Pierwszy wariant tytułu, który mieści się w limicie (od najdłuższego do najkrótszego) */
export function pick(...variants: string[]) {
  return variants.find((v) => v.length <= TITLE_MAX) || variants[variants.length - 1];
}
