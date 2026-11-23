export type ContinentSlug =
  | 'europa'
  | 'afryka'
  | 'azja'
  | 'ameryka-polnocna'
  | 'ameryka-poludniowa'
  | 'australia-i-oceania';

export interface CountryBase {
  code: string;
  ccn3: string | null;
  name: string;
  slug: string;
  continent: ContinentSlug;
  currencies: { code: string; name: string; symbol: string }[];
  languages: string[];
  latlng: [number, number];
  area: number;
  landlocked: boolean;
  neighbors: string[];
  callingCode: string | null;
  tld: string | null;
  eu: boolean;
}

export interface Region {
  slug: string;
  name: string;
  /** "na Krecie", "w Antalyi" */
  loc: string;
  /** typ: wyspa, riwiera, miasto, region */
  type?: string;
  /** slug regionu na wakacje.pl (/wczasy/<slug>/), np. "kreta". Brak = link do kraju */
  wakacjePath?: string;
  gygQuery?: string;
  intro: string[];
  highlights?: string[];
  forWhom?: string;
  places?: { name: string; text: string }[];
  airport?: string;
}

export interface Attraction {
  name: string;
  text: string;
  gygQuery?: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface CountryContent {
  slug: string;
  /** miejscownik z przyimkiem: "w Grecji", "na Malcie" */
  loc: string;
  /** kierunek: "do Grecji", "na Maltę" */
  to: string;
  capital?: string;
  /** krótki opis do kart i meta description (do 160 znaków) */
  teaser: string;
  intro: string[];
  highlights?: string[];
  bestTime?: { text: string; best: number[]; ok?: number[] };
  /** średnie maks. temperatury powietrza i wody, styczeń-grudzień */
  climate?: { air: number[]; sea?: number[] | null; note?: string };
  practical?: {
    flight?: string;
    timeDiff?: string;
    documents?: string;
    money?: string;
    plugs?: string;
    language?: string;
    safety?: string;
  };
  allInclusive?: string[];
  regions?: Region[];
  attractions?: Attraction[];
  cuisine?: string[];
  faq?: Faq[];
  gygQuery?: string;
  /** ścieżka na wakacje.pl, gdy inna niż slug */
  wakacjePath?: string;
  /** czy biura podróży mają ten kierunek w ofercie (wczasy samolotem) */
  touroperator?: boolean;
  /** popularność 1-100 do sortowania */
  popularity?: number;
  updated?: string;
  source?: 'manual' | 'gemini';
}

export interface Country extends CountryBase {
  content: CountryContent | null;
}
