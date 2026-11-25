// TradeDoubler: Ferryhopper (promy), SeePlaces (wycieczki). Link: clk.tradedoubler.com/click?p=<program>&a=<strona>&url=<adres>
import aff from '@/data/affiliate.json';

type Program = 'ferryhopper' | 'seeplaces';
const TD = aff.tradedoubler;

export function tdUrl(program: Program, target: string): string {
  const pr = TD.programs[program];
  let host = '';
  try { host = new URL(target).hostname.replace(/^www\./, ''); } catch {}
  const ok = pr.hosts.some((h) => host === h || host.endsWith('.' + h));
  const url = ok ? target : `https://www.${pr.hosts[0]}/pl/`;
  return `https://clk.tradedoubler.com/click?p=${pr.p}&a=${TD.site}&url=${encodeURIComponent(url)}`;
}

// Promy: kraje i wyspy z połączeniami promowymi (slug portalu -> slug Ferryhopper)
export const FERRY_COUNTRIES: Record<string, string> = {
  grecja: 'greece', chorwacja: 'croatia', wlochy: 'italy', hiszpania: 'spain', francja: 'france', turcja: 'turkey', czarnogora: 'montenegro', albania: 'albania', malta: 'malta',
};
export const FERRY_PLACES: Record<string, string> = {
  'grecja/kreta': 'crete', 'grecja/rodos': 'rhodes', 'grecja/korfu': 'corfu', 'grecja/zakynthos': 'zakynthos', 'grecja/kos': 'kos', 'grecja/santorini': 'santorini', 'grecja/chalkidiki': 'thessaloniki',
  'chorwacja/dalmacja': 'split', 'chorwacja/dubrownik': 'dubrovnik', 'chorwacja/zadar': 'zadar', 'chorwacja/istria': 'pula',
  'wlochy/sycylia': 'sicily', 'wlochy/sardynia': 'sardinia', 'wlochy/apulia': 'bari',
  'hiszpania/teneryfa': 'tenerife', 'hiszpania/gran-canaria': 'gran-canaria', 'hiszpania/fuerteventura': 'fuerteventura', 'hiszpania/lanzarote': 'lanzarote', 'hiszpania/majorka': 'mallorca', 'hiszpania/barcelona': 'barcelona',
  'francja/lazurowe-wybrzeze': 'nice', 'turcja/bodrum': 'bodrum', 'czarnogora/budva': 'bar', 'albania/durres': 'durres', 'albania/wlora': 'vlore', 'malta/gozo': 'gozo',
};
export const hasFerry = (kraj: string) => kraj in FERRY_COUNTRIES;
export const ferryLink = (kraj: string, region?: string) => `/go/prom/${kraj}/${region && FERRY_PLACES[`${kraj}/${region}`] ? region + '/' : ''}`;
