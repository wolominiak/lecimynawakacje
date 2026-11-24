import fs from 'fs';
import path from 'path';
import base from '@/data/countries.json';
import wakacjeIds from '@/data/wakacje-ids.json';
import type { Country, CountryBase, CountryContent, ContinentSlug, Region } from './types';

export const CONTINENTS: { slug: ContinentSlug; name: string; loc: string; teaser: string }[] = [
  { slug: 'europa', name: 'Europa', loc: 'w Europie', teaser: 'Od greckich wysp po fiordy Norwegii - kierunki na krótki lot i długi weekend.' },
  { slug: 'afryka', name: 'Afryka', loc: 'w Afryce', teaser: 'Egipt i Tunezja na ciepłą zimę, Zanzibar i Kenia na safari z plażą.' },
  { slug: 'azja', name: 'Azja', loc: 'w Azji', teaser: 'Tajlandia, Bali, Malediwy, Emiraty - egzotyka, która przestała być daleko.' },
  { slug: 'ameryka-polnocna', name: 'Ameryka Północna i Karaiby', loc: 'w Ameryce Północnej', teaser: 'Dominikana, Meksyk, Kuba i USA - Karaiby all inclusive i wielkie road tripy.' },
  { slug: 'ameryka-poludniowa', name: 'Ameryka Południowa', loc: 'w Ameryce Południowej', teaser: 'Peru, Brazylia, Argentyna i Patagonia - podróże na co najmniej dwa tygodnie.' },
  { slug: 'australia-i-oceania', name: 'Australia i Oceania', loc: 'w Australii i Oceanii', teaser: 'Najdalej, jak się da: Australia, Nowa Zelandia i wyspy Pacyfiku.' },
];

export const MONTHS = [
  { slug: 'styczen', name: 'styczeń', loc: 'w styczniu' },
  { slug: 'luty', name: 'luty', loc: 'w lutym' },
  { slug: 'marzec', name: 'marzec', loc: 'w marcu' },
  { slug: 'kwiecien', name: 'kwiecień', loc: 'w kwietniu' },
  { slug: 'maj', name: 'maj', loc: 'w maju' },
  { slug: 'czerwiec', name: 'czerwiec', loc: 'w czerwcu' },
  { slug: 'lipiec', name: 'lipiec', loc: 'w lipcu' },
  { slug: 'sierpien', name: 'sierpień', loc: 'w sierpniu' },
  { slug: 'wrzesien', name: 'wrzesień', loc: 'we wrześniu' },
  { slug: 'pazdziernik', name: 'październik', loc: 'w październiku' },
  { slug: 'listopad', name: 'listopad', loc: 'w listopadzie' },
  { slug: 'grudzien', name: 'grudzień', loc: 'w grudniu' },
];

/** Podstrony long-tail kraju (ten sam segment URL co regiony) */
export const SUBPAGES = {
  oferty: 'Oferty i ceny',
  'kiedy-jechac': 'Kiedy jechać',
  'all-inclusive': 'All inclusive',
  atrakcje: 'Atrakcje i wycieczki',
} as const;
export type SubpageSlug = keyof typeof SUBPAGES;

let cache: Country[] | null = null;

/** Zabezpieczenie przed nietypowymi odpowiedziami Gemini (tekst zamiast listy itp.) */
const arr = <T,>(v: unknown): T[] | undefined => (v == null ? undefined : Array.isArray(v) ? (v as T[]) : [v as T]);
const nums = (v: unknown): number[] => (arr<unknown>(v) || []).map(Number).filter((n) => Number.isFinite(n));
function normalize(d: any): CountryContent | null {
  if (!d?.slug) return null;
  d.intro = arr<string>(d.intro) || [];
  for (const k of ['highlights', 'allInclusive', 'cuisine', 'attractions', 'faq', 'regions']) d[k] = arr(d[k]);
  d.attractions = d.attractions?.filter((a: any) => a && typeof a === 'object' && a.name);
  d.faq = d.faq?.filter((f: any) => f && f.q && f.a);
  d.regions = d.regions?.filter((r: any) => r && r.slug && r.name).map((r: any) => ({
    ...r,
    intro: arr<string>(r.intro) || [],
    highlights: arr(r.highlights),
    places: arr<any>(r.places)?.filter((p) => p && p.name),
  })).filter((r: any) => r.intro.length);
  if (d.bestTime) {
    d.bestTime.best = nums(d.bestTime.best).filter((m) => m >= 1 && m <= 12);
    d.bestTime.ok = nums(d.bestTime.ok).filter((m) => m >= 1 && m <= 12);
    if (!d.bestTime.text) delete d.bestTime;
  }
  if (d.climate) {
    d.climate.air = nums(d.climate.air);
    d.climate.sea = d.climate.sea ? nums(d.climate.sea) : null;
    if (d.climate.air.length !== 12) delete d.climate;
    else if (d.climate.sea && d.climate.sea.length !== 12) d.climate.sea = null;
  }
  if (d.practical && typeof d.practical !== 'object') delete d.practical;
  return d as CountryContent;
}

function loadContent(): Record<string, CountryContent> {
  const dir = path.join(process.cwd(), 'content', 'countries');
  const out: Record<string, CountryContent> = {};
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    try {
      const data = normalize(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
      if (data) out[data.slug] = data;
    } catch (e) {
      // uszkodzony plik nie może wywalić całego builda
      console.warn(`Pomijam ${f}: ${(e as Error).message}`);
    }
  }
  return out;
}

export function getCountries(): Country[] {
  if (cache) return cache;
  const content = loadContent();
  cache = (base as CountryBase[]).map((c) => ({ ...c, content: content[c.slug] || null }));
  return cache;
}

export function getCountry(slug: string): Country | undefined {
  return getCountries().find((c) => c.slug === slug);
}

export function getCountryByCode(code: string): Country | undefined {
  return getCountries().find((c) => c.code === code);
}

export function getByContinent(slug: ContinentSlug): Country[] {
  return getCountries().filter((c) => c.continent === slug);
}

/** Strona ma wystarczająco treści, żeby ją indeksować */
export function isIndexable(c: Country): boolean {
  return !!c.content && c.content.intro.join(' ').length > 400;
}

export function popular(limit = 12): Country[] {
  return getCountries()
    .filter((c) => c.content?.popularity)
    .sort((a, b) => (b.content!.popularity || 0) - (a.content!.popularity || 0))
    .slice(0, limit);
}

export function getRegion(c: Country, slug: string): Region | undefined {
  return c.content?.regions?.find((r) => r.slug === slug);
}

export function availableSubpages(c: Country): SubpageSlug[] {
  const out: SubpageSlug[] = [];
  const ct = c.content;
  if (!ct) return out;
  if (wakacjeCountryId(c.slug)) out.push('oferty');
  if (ct.climate && ct.bestTime) out.push('kiedy-jechac');
  if (ct.allInclusive?.length) out.push('all-inclusive');
  if ((ct.attractions?.length || 0) >= 4) out.push('atrakcje');
  return out;
}

export function continentOf(slug: ContinentSlug) {
  return CONTINENTS.find((c) => c.slug === slug)!;
}

/** Kraje dobre na wypoczynek w danym miesiącu (0-11) wg danych klimatycznych */
export function warmIn(month: number) {
  return getCountries()
    .filter((c) => c.content?.climate)
    .map((c) => {
      const air = c.content!.climate!.air[month];
      const sea = c.content!.climate!.sea?.[month] ?? null;
      const best = c.content!.bestTime?.best.includes(month + 1) || false;
      const ok = c.content!.bestTime?.ok?.includes(month + 1) || false;
      const pop = c.content!.popularity || 0;
      const score = (best ? 18 : ok ? 10 : 0) + pop * 0.3 + (sea && sea >= 23 ? 8 : sea && sea >= 21 ? 4 : 0) - (air > 35 ? (air - 35) * 4 : 0);
      return { country: c, air, sea, best, ok, score };
    })
    .filter((x) => x.air >= 24 && (x.best || x.ok))
    .sort((a, b) => b.score - a.score);
}

export function countryName(code: string) {
  return getCountryByCode(code);
}

/** ID kraju w wyszukiwarce wakacje.pl (TravelLead), potrzebne do widgetu z ofertami */
export function wakacjeCountryId(slug: string): number | null {
  return (wakacjeIds.countries as Record<string, number>)[slug] ?? null;
}
/** ID regionu w wakacje.pl, np. "grecja/kreta" */
export function wakacjeRegionId(countrySlug: string, regionSlug: string): number | null {
  return (wakacjeIds.regions as Record<string, number>)[`${countrySlug}/${regionSlug}`] ?? null;
}
