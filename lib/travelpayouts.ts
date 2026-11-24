// Travelpayouts: DiscoverCars (auta), Booking.com (noclegi), Aviasales (loty).
// Link partnerski: tp.media/r?campaign_id&marker&p&trs&u=<adres docelowy>.
// Na stronie używamy zamaskowanych linków /go/auto/, /go/nocleg/, /go/lot/.
import aff from '@/data/affiliate.json';
import type { Country, Region } from './types';

type Program = 'discovercars' | 'booking' | 'aviasales';
const TP = aff.travelpayouts;

export function tpUrl(program: Program, target: string): string {
  const pr = TP.programs[program];
  let host = '';
  try { host = new URL(target).hostname.replace(/^www\./, ''); } catch {}
  const ok = pr.hosts.some((h) => host === h || host.endsWith('.' + h));
  const u = ok ? target : `https://www.${pr.hosts[0]}/`;
  const q = new URLSearchParams({ campaign_id: pr.campaign_id, marker: TP.marker, p: pr.p, trs: TP.trs, u });
  return `https://tp.media/r?${q}`;
}

/** Kod IATA lotniska z pola "airport" przewodnika, np. "Tirana (TIA) lub Korfu (CFU)" -> TIA */
export function iataOf(s?: string): string | undefined {
  return (s || '').match(/\b[A-Z]{3}\b/)?.[0];
}
export function countryIata(c: Country): string | undefined {
  for (const r of c.content?.regions || []) { const x = iataOf(r.airport); if (x) return x; }
  return undefined;
}

export const ORIGINS = [
  { code: 'WAW', name: 'Warszawa' }, { code: 'KRK', name: 'Kraków' }, { code: 'KTW', name: 'Katowice' },
  { code: 'GDN', name: 'Gdańsk' }, { code: 'WRO', name: 'Wrocław' }, { code: 'POZ', name: 'Poznań' },
  { code: 'WMI', name: 'Warszawa Modlin' }, { code: 'RZE', name: 'Rzeszów' }, { code: 'LUZ', name: 'Lublin' },
  { code: 'SZZ', name: 'Szczecin' }, { code: 'BZG', name: 'Bydgoszcz' }, { code: 'LCJ', name: 'Łódź' },
];

// Zamaskowane linki
export const carLink = (c: Country) => `/go/auto/${c.slug}/`;
export const stayLink = (q: string) => `/go/nocleg/?q=${encodeURIComponent(q)}`;
export const flightLink = (dest?: string, o = 'WAW') => (dest ? `/go/lot/?o=${o}&d=${dest}` : '/go/lot/');

/** Wszystko "na własną rękę" dla kraju lub regionu (strony i asystent AI) */
export function selfTravel(c: Country, r?: Region) {
  const dest = (r && iataOf(r.airport)) || countryIata(c);
  return {
    loty: flightLink(dest),
    lotnisko: dest,
    noclegi: stayLink(r ? `${r.name}, ${c.name}` : c.name),
    auto: carLink(c),
  };
}
