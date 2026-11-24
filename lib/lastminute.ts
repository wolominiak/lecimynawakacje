import { getCountry, wakacjeCountryId } from './data';
import type { LmCountry } from '@/components/LastMinuteBrowser';

// Kraje doczytywane osobno na stronie last minute. name = nazwa kraju tak, jak zwraca ją wakacje.pl
const LIST: [string, string][] = [
  ['egipt', 'Egipt'], ['turcja', 'Turcja'], ['grecja', 'Grecja'], ['hiszpania', 'Hiszpania'], ['tunezja', 'Tunezja'],
  ['cypr', 'Cypr'], ['malta', 'Malta'], ['zjednoczone-emiraty-arabskie', 'Emiraty Arabskie'], ['tajlandia', 'Tajlandia'],
  ['dominikana', 'Dominikana'], ['tanzania', 'Tanzania'], ['meksyk', 'Meksyk'], ['maroko', 'Maroko'], ['bulgaria', 'Bułgaria'],
  ['portugalia', 'Portugalia'], ['wlochy', 'Włochy'], ['kenia', 'Kenia'], ['malediwy', 'Malediwy'], ['sri-lanka', 'Sri Lanka'],
  ['wietnam', 'Wietnam'], ['wyspy-zielonego-przyladka', 'Wyspy Zielonego Przylądka'], ['albania', 'Albania'], ['oman', 'Oman'],
  ['indonezja', 'Indonezja'], ['chorwacja', 'Chorwacja'],
];

export function lmCountries(): LmCountry[] {
  return LIST.map(([slug, name]) => ({ slug, name, id: wakacjeCountryId(slug)! })).filter((c) => c.id);
}

export function lmCountry(slug: string) {
  const c = lmCountries().find((x) => x.slug === slug);
  if (!c) return null;
  return { ...c, country: getCountry(slug)! };
}
