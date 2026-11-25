import type { MetadataRoute } from 'next';
import { CRUISE_AREAS } from '@/lib/cruises';
import { CONTINENTS, MONTHS, getCountries, isIndexable, availableSubpages } from '@/lib/data';
import { SITE } from '@/lib/affiliate';
import { lmCountries } from '@/lib/lastminute';
import { imageFor } from '@/lib/images';
import { attractionsOf } from '@/lib/attractions';

// Sitemapa: wszystkie indeksowane strony, ze zdjęciami (Google Grafika).
// Data aktualizacji tylko tam, gdzie treść faktycznie zmienia się codziennie (oferty, last minute, rejsy):
// Google ignoruje lastmod, który zmienia się bez zmiany treści.
type Entry = MetadataRoute.Sitemap[number];
const today = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string, priority: number, opts: { img?: string | null; daily?: boolean } = {}): Entry => ({
    url: SITE.url + p,
    priority,
    changeFrequency: opts.daily ? 'daily' : 'monthly',
    ...(opts.daily ? { lastModified: today } : {}),
    ...(opts.img ? { images: [SITE.url + opts.img] } : {}),
  });

  const out: MetadataRoute.Sitemap = [
    u('/', 1, { daily: true }),
    u('/wakacje/', 0.9),
    u('/gdzie-na-wakacje/', 0.8),
    u('/last-minute/', 0.9, { daily: true }),
    u('/rejsy/', 0.9, { daily: true, img: imageFor('rejsy') }),
    u('/asystent/', 0.8),
    u('/o-serwisie/', 0.3),
    ...['all-inclusive', 'tanie-wakacje', 'wakacje-nad-morzem', 'egzotyka', 'wycieczki-objazdowe'].map((k) => u(`/${k}/`, 0.9, { daily: true })),
    ...['loty', 'hotele', 'wynajem-auta', 'wycieczki-fakultatywne'].map((k) => u(`/${k}/`, 0.8)),
  ];
  CRUISE_AREAS.forEach((a) => out.push(u(`/rejsy/${a.slug}/`, 0.8, { daily: true, img: imageFor(`rejsy-${a.slug}`) })));
  lmCountries().forEach((c) => out.push(u(`/last-minute/${c.slug}/`, 0.8, { daily: true, img: imageFor(c.slug) })));
  CONTINENTS.forEach((c) => out.push(u(`/kontynenty/${c.slug}/`, 0.7)));
  MONTHS.forEach((m) => out.push(u(`/gdzie-na-wakacje/${m.slug}/`, 0.7)));

  for (const c of getCountries()) {
    if (!isIndexable(c)) continue;
    const img = imageFor(c.slug);
    out.push(u(`/wakacje/${c.slug}/`, 0.9, { img }));
    c.content!.regions?.forEach((r) => out.push(u(`/wakacje/${c.slug}/${r.slug}/`, 0.8, { img: imageFor(`${c.slug}-${r.slug}`) || img })));
    availableSubpages(c).forEach((s) => out.push(u(`/wakacje/${c.slug}/${s}/`, s === 'oferty' ? 0.8 : 0.7, { daily: s === 'oferty', img })));
    attractionsOf(c.slug).forEach((a) => out.push(u(`/wakacje/${c.slug}/atrakcje/${a.slug}/`, 0.7, { img })));
  }
  return out;
}
