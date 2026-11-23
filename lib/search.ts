import { getCountries, continentOf } from './data';
import type { SearchItem } from '@/components/Search';

export function searchItems(): SearchItem[] {
  const out: SearchItem[] = [];
  for (const c of getCountries()) {
    out.push({ n: c.name, u: `/wakacje/${c.slug}/`, s: continentOf(c.continent).name });
    for (const r of c.content?.regions || []) out.push({ n: r.name, u: `/wakacje/${c.slug}/${r.slug}/`, s: c.name });
  }
  return out;
}
