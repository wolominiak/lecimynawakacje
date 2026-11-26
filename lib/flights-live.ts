// Świeże ceny lotów z Aviasales Data API (po stronie serwera, cache 15 minut).
// Bierzemy tylko bilety znalezione niedawno (pole found_at): najpierw z ostatnich 24 godzin,
// jeśli takich brak, z 72 godzin. Starsze ceny często są już nieaktualne.
// Bez tokena albo przy błędzie API zostają ceny z codziennego pliku data/flights.json.
import type { Route } from './flights';

const API = 'https://api.travelpayouts.com';
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
export const LIVE_TTL = 900;

type Latest = { origin: string; destination: string; depart_date: string; return_date?: string | null; value: number; found_at?: string; number_of_changes?: number; actual?: boolean };

async function latest(params: Record<string, string>): Promise<Latest[] | null> {
  if (!TOKEN) return null;
  const q = new URLSearchParams({
    currency: 'pln', market: 'pl', period_type: 'year', one_way: 'false', sorting: 'price', limit: '1000', page: '1', show_to_affiliates: 'true', ...params,
  });
  try {
    const r = await fetch(`${API}/aviasales/v3/get_latest_prices?${q}`, { headers: { 'X-Access-Token': TOKEN }, next: { revalidate: LIVE_TTL } });
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j?.data) ? j.data : null;
  } catch {
    return null;
  }
}

const HOUR = 3600000;
const ageH = (t: Latest) => (t.found_at ? (Date.now() - Date.parse(t.found_at)) / HOUR : 999);

/** Bilety przyszłe i świeże: najpierw do 24 h, potem do 72 h */
function fresh(list: Latest[]): Latest[] {
  const today = new Date().toISOString().slice(0, 10);
  const ok = list.filter((t) => t.value > 0 && t.actual !== false && t.depart_date?.slice(0, 10) >= today);
  for (const h of [24, 72]) {
    const f = ok.filter((t) => ageH(t) <= h);
    if (f.length) return f;
  }
  return [];
}

export type LiveRoute = Route & { live: boolean; foundH?: number };

/** Trasa z aktualną najniższą ceną i cenami w miesiącach (tylko świeże bilety) */
export async function liveRoute(r: Route): Promise<LiveRoute> {
  const list = await latest({ origin: r.o, destination: r.d });
  if (!list) return { ...r, live: false };
  const f = fresh(list);
  if (!f.length) return { ...r, live: false };
  const months: Record<string, number> = {};
  const monthDates: Record<string, [string, string | null]> = {};
  for (const t of f) {
    const m = t.depart_date.slice(0, 7);
    if (!months[m] || t.value < months[m]) {
      months[m] = Math.round(t.value);
      monthDates[m] = [t.depart_date.slice(0, 10), t.return_date?.slice(0, 10) || null];
    }
  }
  const best = f.reduce((a, b) => (b.value < a.value ? b : a));
  return {
    ...r, live: true, foundH: Math.max(1, Math.round(ageH(best))),
    price: Math.round(best.value), dep: best.depart_date.slice(0, 10), ret: best.return_date?.slice(0, 10) || null,
    transfers: best.number_of_changes ?? r.transfers,
    months: Object.keys(months).length > 1 ? months : r.months,
    monthDates: Object.keys(months).length > 1 ? monthDates : r.monthDates,
  };
}

/** Aktualne najniższe ceny dla listy tras (jedno zapytanie na lotnisko wylotu) */
export async function livePrices<T extends Route>(routes: T[]): Promise<{ routes: (T & { fresh?: boolean })[]; live: boolean }> {
  const origins = [...new Set(routes.map((r) => r.o))];
  const lists = await Promise.all(origins.map((o) => latest({ origin: o })));
  const best = new Map<string, Latest>();
  origins.forEach((o, i) => {
    for (const t of fresh(lists[i] || [])) {
      const k = `${o}-${t.destination}`;
      const cur = best.get(k);
      if (!cur || t.value < cur.value) best.set(k, t);
    }
  });
  if (!best.size) return { routes, live: false };
  const out = routes.map((r) => {
    const t = best.get(`${r.o}-${r.d}`);
    return t ? { ...r, fresh: true, price: Math.round(t.value), dep: t.depart_date.slice(0, 10), ret: t.return_date?.slice(0, 10) || null } : { ...r, fresh: false };
  });
  return { routes: out, live: true };
}

/** Godzina sprawdzenia cen, czas polski */
export const checkedAt = () => new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });
