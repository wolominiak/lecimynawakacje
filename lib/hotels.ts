import fs from 'fs';
import path from 'path';

// Karty hoteli: content/hotels/<slug>.json (generator: scripts/generate-hotels.mjs)
export type Hotel = {
  id: number; slug: string; name: string; country: string; place: string[]; stars: number; photo: string | null;
  city: string; area?: string; address?: string;
  beachDistanceM?: number | null; beachType?: string; privateBeach?: boolean | null;
  airportName?: string; airportKm?: number | null; centerKm?: number | null;
  opened?: number | null; renovated?: number | null; rooms?: number | null;
  pools?: number | null; heatedPool?: boolean | null; aquapark?: boolean | null; kidsClub?: boolean | null; animations?: boolean | null;
  spa?: boolean | null; gym?: boolean | null; wifi?: boolean | null; adultsOnly?: boolean | null;
  restaurants?: number | null; bars?: number | null;
  roomTypes?: string[]; amenities?: string[]; goodFor?: string[]; pros: string[]; cons: string[];
  intro: string[]; sections: { title: string; text: string }[]; faq: { q: string; a: string }[];
  geo: { lat: number; lon: number; src: string } | null; sources?: string[]; updated: string;
};

export const HOTEL_IMG = 'https://i.wakacje.pl';
const dir = path.join(process.cwd(), 'content', 'hotels');
let cache: Hotel[] | null = null;

export function allHotels(): Hotel[] {
  if (cache) return cache;
  cache = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as Hotel; } catch { return null; } })
      .filter((h): h is Hotel => !!h?.intro?.length && !!h.slug)
    : [];
  return cache;
}

export const getHotel = (slug: string) => allHotels().find((h) => h.slug === slug);
export const hotelUrl = (slug: string) => `/hotel/${slug}/`;
export const hotelsOf = (country: string) => allHotels().filter((h) => h.country === country);

/** Najbliższe hotele (po współrzędnych), w tym samym kraju */
export function nearbyHotels(h: Hotel, n = 6): Hotel[] {
  const same = hotelsOf(h.country).filter((x) => x.slug !== h.slug);
  if (!h.geo) return same.slice(0, n);
  const d = (x: Hotel) => (x.geo ? Math.hypot(x.geo.lat - h.geo!.lat, (x.geo.lon - h.geo!.lon) * Math.cos((h.geo!.lat * Math.PI) / 180)) : 99);
  return same.sort((a, b) => d(a) - d(b)).slice(0, n);
}

export const distLabel = (m?: number | null) => (m == null ? '' : m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);
/** "150 m od plaży" albo "przy plaży" */
export const beachLabel = (m?: number | null) => (m == null ? '' : m <= 30 ? 'przy plaży' : `${distLabel(m)} od plaży`);
