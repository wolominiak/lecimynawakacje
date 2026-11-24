import type { MetadataRoute } from 'next';
import { CONTINENTS, MONTHS, getCountries, isIndexable, availableSubpages } from '@/lib/data';
import { SITE } from '@/lib/affiliate';
import { lmCountries } from '@/lib/lastminute';

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string, priority = 0.6): MetadataRoute.Sitemap[number] => ({ url: SITE.url + p, changeFrequency: 'monthly', priority });
  const out: MetadataRoute.Sitemap = [u('/', 1), u('/wakacje/', 0.9), u('/gdzie-na-wakacje/', 0.8)];
  out.push(u('/last-minute/', 0.9));
  out.push(u('/asystent/', 0.8));
  lmCountries().forEach((c) => out.push(u(`/last-minute/${c.slug}/`, 0.8)));
  CONTINENTS.forEach((c) => out.push(u(`/kontynenty/${c.slug}/`, 0.7)));
  MONTHS.forEach((m) => out.push(u(`/gdzie-na-wakacje/${m.slug}/`, 0.7)));
  for (const c of getCountries()) {
    if (!isIndexable(c)) continue;
    out.push(u(`/wakacje/${c.slug}/`, 0.9));
    c.content!.regions?.forEach((r) => out.push(u(`/wakacje/${c.slug}/${r.slug}/`, 0.8)));
    availableSubpages(c).forEach((s) => out.push(u(`/wakacje/${c.slug}/${s}/`, 0.7)));
  }
  return out;
}
