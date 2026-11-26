// Ceny lotów z Polski (data/flights.json, aktualizowane codziennie przez scripts/fetch-flights.mjs).
import data from '@/data/flights.json';

export type FlightRoute = {
  o: string; oName: string; oFrom: string; d: string; name: string; country: string; region: string;
  price: number; dep?: string; ret?: string | null; airline?: string | null; transfers?: number | null;
  months: Record<string, number>;
};

const ROUTES = (data as { updated: string | null; routes: Record<string, FlightRoute> }).routes || {};
export const FLIGHTS_UPDATED = (data as { updated: string | null }).updated;

export const allRoutes = () => Object.entries(ROUTES).map(([slug, r]) => ({ slug, ...r }));
export type Route = ReturnType<typeof allRoutes>[number];
export const getRoute = (slug: string): Route | null => (ROUTES[slug] ? { slug, ...ROUTES[slug] } : null);
export const routeUrl = (slug: string) => `/loty/${slug}/`;

/** Trasy do kraju (lub regionu), najtańsze najpierw */
export function routesTo(country: string, region?: string): Route[] {
  const all = allRoutes().filter((r) => r.country === country);
  const reg = region ? all.filter((r) => r.region === region) : [];
  return (reg.length ? reg : all).sort((a, b) => a.price - b.price);
}

/** Link do wyszukiwarki z datami najtańszego lotu */
export function searchHref(r: Pick<Route, 'o' | 'd'>, dep?: string, ret?: string | null) {
  return `/go/lot/?o=${r.o}&d=${r.d}${dep ? `&dd=${dep}` : ''}${ret ? `&rd=${ret}` : ''}&a=1`;
}

export const transfersLabel = (n?: number | null) => (n == null ? '' : n === 0 ? 'bez przesiadek' : n === 1 ? '1 przesiadka' : `${n} przesiadki`);
const MON = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
const MON_LOC = ['w styczniu', 'w lutym', 'w marcu', 'w kwietniu', 'w maju', 'w czerwcu', 'w lipcu', 'w sierpniu', 'we wrześniu', 'w październiku', 'w listopadzie', 'w grudniu'];
export const monthShort = (k: string) => `${MON[Number(k.slice(5, 7)) - 1]} ${k.slice(0, 4)}`;
export const monthLoc = (k: string) => `${MON_LOC[Number(k.slice(5, 7)) - 1]} ${k.slice(0, 4)}`;
export const fmtDay = (d?: string | null) => (d ? `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}` : '');
export const zl = (n: number) => n.toLocaleString('pl-PL') + ' zł';

/** Przyszłe miesiące z ceną, chronologicznie */
export function monthRows(r: Route) {
  const now = new Date().toISOString().slice(0, 7);
  return Object.entries(r.months).filter(([m]) => m >= now).sort(([a], [b]) => a.localeCompare(b)).slice(0, 12);
}
