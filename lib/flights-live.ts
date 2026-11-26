// Świeże ceny lotów prosto z Aviasales Data API (po stronie serwera, cache 15 minut).
// Jeśli brak tokena albo API nie odpowie, zostają ceny z codziennego pliku data/flights.json.
import type { Route } from './flights';

const API = 'https://api.travelpayouts.com';
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
export const LIVE_TTL = 900;

async function get(p: string, params: Record<string, string>) {
  if (!TOKEN) return null;
  const q = new URLSearchParams({ currency: 'pln', market: 'pl', ...params });
  try {
    const r = await fetch(`${API}${p}?${q}`, { headers: { 'X-Access-Token': TOKEN }, next: { revalidate: LIVE_TTL } });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.data ?? null;
  } catch {
    return null;
  }
}

type Ticket = { destination: string; price: number; departure_at?: string; return_at?: string; transfers?: number; airline?: string };

/** Trasa z aktualną najniższą ceną i cenami w miesiącach */
export async function liveRoute(r: Route): Promise<Route & { live: boolean }> {
  const [cheap, months] = await Promise.all([
    get('/aviasales/v3/prices_for_dates', { origin: r.o, destination: r.d, one_way: 'false', sorting: 'price', limit: '1' }),
    get('/aviasales/v3/grouped_prices', { origin: r.o, destination: r.d, group_by: 'month', one_way: 'false' }),
  ]);
  const t = Array.isArray(cheap) ? (cheap[0] as Ticket | undefined) : undefined;
  const m: Record<string, number> = {};
  if (months && typeof months === 'object') for (const [k, v] of Object.entries(months as Record<string, Ticket>)) if (v?.price) m[k.slice(0, 7)] = Math.round(v.price);
  if (!t?.price) return { ...r, months: Object.keys(m).length ? m : r.months, live: Object.keys(m).length > 0 };
  return {
    ...r, live: true, price: Math.round(t.price), dep: t.departure_at?.slice(0, 10), ret: t.return_at?.slice(0, 10) || null,
    transfers: t.transfers ?? r.transfers, airline: t.airline || r.airline, months: Object.keys(m).length ? m : r.months,
  };
}

/** Aktualne najniższe ceny dla listy tras (jedno zapytanie na lotnisko wylotu) */
export async function livePrices<T extends Route>(routes: T[]): Promise<{ routes: T[]; live: boolean }> {
  const origins = [...new Set(routes.map((r) => r.o))];
  const lists = await Promise.all(origins.map((o) => get('/aviasales/v3/prices_for_dates', { origin: o, unique: 'true', sorting: 'price', limit: '1000', one_way: 'false' })));
  const best = new Map<string, Ticket>();
  origins.forEach((o, i) => {
    const l = lists[i];
    if (Array.isArray(l)) for (const t of l as Ticket[]) best.set(`${o}-${t.destination}`, t);
  });
  if (!best.size) return { routes, live: false };
  const out = routes.map((r) => {
    const t = best.get(`${r.o}-${r.d}`);
    return t?.price ? { ...r, price: Math.round(t.price), dep: t.departure_at?.slice(0, 10), ret: t.return_at?.slice(0, 10) || null } : r;
  });
  return { routes: out, live: true };
}

/** Godzina sprawdzenia cen, czas polski */
export const checkedAt = () => new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });
