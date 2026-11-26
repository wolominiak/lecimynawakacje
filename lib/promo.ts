// Wspólne pobieranie ofert dla banerów promocyjnych (API widgetu TravelLead).
// Wyniki trzymamy w pamięci i w sessionStorage, żeby przechodzenie między stronami nie pytało API od nowa.

const API = 'https://widget.wakacje.pl/v2/api/widgets/offers';
const TTL = 30 * 60 * 1000;

type Raw = {
  id: number; name: string; price: string; duration: number; departureDate: string; category: number;
  departure?: { label: string }; service?: { label: string; value: number }; transport?: { value: number };
  placeName?: string[]; ratingValue?: number; url: string;
};

export type PromoOffer = {
  id: number; hotel: string; price: number; date: string; days: number; stars: number;
  from: string; board: string; place: string[]; rating: number; url: string; tour: boolean;
};

const mem = new Map<string, Promise<PromoOffer[]>>();

function norm(o: Raw): PromoOffer {
  return {
    id: o.id, hotel: o.name, price: Number(String(o.price).replace(/\s/g, '')) || 0, date: o.departureDate,
    days: o.duration || 0, stars: o.category || 0, from: o.departure?.label || '', board: o.service?.label || '',
    place: o.placeName || [], rating: o.ratingValue || 0, url: o.url, tour: /objazd/i.test(o.placeName?.[1] || ''),
  };
}

export const todayMs = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const daysTo = (iso: string) => Math.round((new Date(iso + 'T00:00:00').getTime() - todayMs()) / 86400000);
export const fmtPrice = (n: number) => n.toLocaleString('pl-PL') + ' zł';
export const fmtDate = (d: string) => d.slice(8, 10) + '.' + d.slice(5, 7);
export const offerHref = (o: PromoOffer, c: string) => `/go/oferta/?c=${c}&u=` + encodeURIComponent(o.url);

/** Oferty dla podanych warunków: tylko przyszłe wyloty samolotem, bez Polski. */
export function promoOffers(terms: Record<string, unknown>): Promise<PromoOffer[]> {
  const key = 'promo:' + JSON.stringify(terms);
  const hit = mem.get(key);
  if (hit) return hit;
  const p = (async () => {
    try {
      const s = sessionStorage.getItem(key);
      if (s) { const j = JSON.parse(s); if (Date.now() - j.t < TTL) return j.d as PromoOffer[]; }
    } catch { /* brak dostępu do storage */ }
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 9000);
    try {
      const r = await fetch(API, {
        method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms: { regions: [], cities: [], countries: [], limit: 100, ...terms } }),
      });
      const j = await r.json();
      const d = (Array.isArray(j.data) ? j.data as Raw[] : [])
        .filter((o) => (!o.transport || o.transport.value === 1) && o.placeName?.[0] !== 'Polska' && daysTo(o.departureDate) >= 0)
        .map(norm).filter((o) => o.price > 0);
      try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch { /* pełny storage */ }
      return d;
    } catch {
      mem.delete(key);
      return [];
    } finally {
      clearTimeout(timer);
    }
  })();
  mem.set(key, p);
  return p;
}

export const cheapest = (l: PromoOffer[]) => l.reduce<PromoOffer | null>((m, o) => (!m || o.price < m.price ? o : m), null);
