// Narzędzia asystenta AI: dane portalu (przewodniki), oferty Exim i wakacje.pl, last minute, eSIM, wycieczki.
// Model nie zna cen ani ofert z głowy, dostaje je wyłącznie stąd.
import { getCountries, warmIn, wakacjeCountryId, wakacjeRegionId, MONTHS } from './data';
import { gygSearchUrl, wakacjeUrl } from './affiliate';
import { esimFor, esimUrl } from './esim';
import type { Country, Region } from './types';
import { selfTravel } from './travelpayouts';
import { attractionUrl } from './attractions';
import { CRUISE_AREAS, CRUISE_COUNTRY_ID, areaOf, lineOf, splitName } from './cruises';

export type Card = {
  title: string; place: string; stars?: number; img?: string;
  from?: string; date?: string; nights?: number; board?: string;
  pricePP?: number; priceTotal?: number; persons?: number; url: string; src: string; lm?: boolean; hotelId?: number;
};

const TL_API = 'https://widget.wakacje.pl/v2/api/widgets/offers';
const TL_IMG = 'https://i.wakacje.pl';
const norm = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').trim();
const cut = (s: string | undefined, n: number) => (!s ? undefined : s.length > n ? s.slice(0, s.lastIndexOf(' ', n - 3) > 0 ? s.lastIndexOf(' ', n - 3) : n - 3) + '...' : s);
const today = () => new Date().toISOString().slice(0, 10);
const num = (s: string | number) => Number(String(s).replace(/[^\d]/g, '')) || 0;
const addDays = (d: string, n: number) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

/** Kraj lub region po nazwie, w dowolnej formie ("Kreta", "grecja", "Wyspy Kanaryjskie") */
export function resolvePlace(q: string): { c: Country; r?: Region } | null {
  const t = norm(q);
  if (!t) return null;
  const all = getCountries();
  for (const c of all) if (norm(c.name) === t || c.slug === t.replace(/\s+/g, '-')) return { c };
  for (const c of all) for (const r of c.content?.regions || []) if (norm(r.name) === t || r.slug === t.replace(/\s+/g, '-')) return { c, r };
  for (const c of all) for (const r of c.content?.regions || []) if (norm(r.name).includes(t) || t.includes(norm(r.name))) return { c, r };
  for (const c of all) if (norm(c.name).startsWith(t) || t.includes(norm(c.name))) return { c };
  return null;
}

function climateLine(c: Country) {
  const cl = c.content?.climate;
  if (!cl) return undefined;
  return MONTHS.map((m, i) => `${m.name.slice(0, 3)} ${cl.air[i]}°C${cl.sea?.[i] != null ? `/morze ${cl.sea[i]}°C` : ''}`).join(', ');
}

/** Kierunki wspomniane w tekście (odmiana: dopasowanie po rdzeniu nazwy), max 3 */
export function detectPlaces(text: string): string[] {
  const t = ' ' + norm(text).replace(/[^a-z0-9 ]/g, ' ') + ' ';
  const stem = (n: string) => { const x = norm(n); return x.length <= 5 ? x.slice(0, 4) : x.slice(0, Math.max(5, x.length - 2)); };
  // polska odmiana: Kreta -> na Krecie, Malta -> na Malcie, Teneryfa -> na Teneryfie
  const MUT: Record<string, string[]> = { t: ['c'], d: ['dz'], r: ['rz'], k: ['c'], g: ['dz'], s: ['si', 'sz'], n: ['ni'], z: ['zi'] };
  const hit = (n: string) => {
    const st = stem(n);
    if (st.length < 4) return false;
    const vars = [st, ...(MUT[st.slice(-1)] || []).map((m) => st.slice(0, -1) + m)];
    return vars.some((v) => t.includes(' ' + v));
  };
  const out: { name: string; len: number }[] = [];
  for (const c of getCountries()) {
    if (hit(c.name)) out.push({ name: c.name, len: c.name.length + 100 });
    for (const r of c.content?.regions || []) if (hit(r.name)) out.push({ name: r.name, len: r.name.length });
  }
  return [...new Set(out.sort((a, b) => b.len - a.len).map((x) => x.name))].slice(0, 3);
}

/** Wszystkie ścieżki (zaczynające się od "/") w wyniku narzędzia */
export function collectLinks(v: unknown, out = new Set<string>()): Set<string> {
  if (typeof v === 'string') { if (v.startsWith('/') && !v.startsWith('//')) out.add(v); }
  else if (Array.isArray(v)) v.forEach((x) => collectLinks(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collectLinks(x, out));
  return out;
}

// 1. Przewodnik po kraju lub regionie
export function guide(args: { kierunek: string }) {
  const p = resolvePlace(args.kierunek);
  if (!p) return { blad: `Nie znam kierunku "${args.kierunek}". Poproś o doprecyzowanie.` };
  const { c, r } = p;
  const ct = c.content;
  const es = esimFor(c);
  const base: Record<string, unknown> = {
    kraj: c.name,
    link_przewodnik: `/wakacje/${c.slug}/`,
    opis: ct?.teaser,
    kiedy_jechac: ct?.bestTime?.text,
    najlepsze_miesiace: ct?.bestTime?.best?.map((m) => MONTHS[m - 1]?.name),
    klimat_srednie_max: climateLine(c),
    praktyczne: ct?.practical,
    waluta: c.currencies?.map((x) => x.code).join(', '),
    ue: c.eu,
    esim: es ? { link: esimUrl(c), cena_od_usd: es.package } : undefined,
    link_oferty_wakacje_pl: ct?.touroperator ? wakacjeUrl(ct.wakacjePath || c.slug) : undefined,
    link_wycieczki_getyourguide: gygSearchUrl(ct?.gygQuery || c.name),
    na_wlasna_reke: selfTravel(c, r),
  };
  if (r) {
    return {
      ...base,
      region: r.name,
      typ: r.type,
      link_region: `/wakacje/${c.slug}/${r.slug}/`,
      dla_kogo: r.forWhom,
      lotnisko: r.airport,
      opis_regionu: cut(r.intro?.join(' '), 900),
      miejsca: r.places?.map((x) => ({ nazwa: x.name, opis: cut(x.text, 220) })),
      wycieczki_region: gygSearchUrl(r.gygQuery || r.name),
      link_oferty_region: wakacjeUrl(r.wakacjePath || ct?.wakacjePath || c.slug),
    };
  }
  return {
    ...base,
    wstep: cut(ct?.intro?.join(' '), 700),
    regiony: ct?.regions?.map((x) => ({ nazwa: x.name, typ: x.type, link: `/wakacje/${c.slug}/${x.slug}/`, dla_kogo: cut(x.forWhom, 200), lotnisko: x.airport })),
    atrakcje: ct?.attractions?.slice(0, 12).map((a) => ({ nazwa: a.name, opis: cut(a.text, 200), link_wycieczki: gygSearchUrl(a.gygQuery || a.name), ...(attractionUrl(c, a.name) ? { link_opis: attractionUrl(c, a.name) } : {}) })),
    all_inclusive: ct?.allInclusive?.slice(0, 4).map((x) => cut(x, 200)),
    kuchnia: ct?.cuisine?.slice(0, 6).map((x) => cut(String(x), 120)),
  };
}

// 2. Propozycje kierunków na dany miesiąc
export function suggest(args: { miesiac: number }) {
  const m = Math.min(12, Math.max(1, Math.round(args.miesiac || new Date().getMonth() + 1))) - 1;
  return {
    miesiac: MONTHS[m].name,
    kierunki: warmIn(m).slice(0, 12).map((x) => ({
      kraj: x.country.name, link: `/wakacje/${x.country.slug}/`, powietrze: x.air, morze: x.sea,
      idealny_miesiac: x.best, oferty_biur: !!x.country.content?.touroperator, opis: x.country.content?.teaser,
    })),
  };
}

type OfferArgs = { kierunek?: string; od?: string; do?: string; noce_min?: number; noce_max?: number; wyzywienie?: string; lotnisko?: string; budzet_na_osobe?: number; sortuj?: string; osoby?: number; typ?: string };

const BOARD: Record<string, { tl: number; ex: RegExp }> = {
  'all inclusive': { tl: 1, ex: /all inclusive|\bai\b|ultra/i },
  'hb': { tl: 2, ex: /obiadokolac|\bhb\b|half/i },
  'sniadania': { tl: 3, ex: /^sniadania$|\bbb\b/i },
  'bez wyzywienia': { tl: 4, ex: /bez/i },
};
const boardKey = (s?: string) => {
  const t = norm(s || '');
  if (!t) return null;
  if (t.includes('all') || t.includes('ultra')) return BOARD['all inclusive'];
  if (t.includes('obiad') || t === 'hb' || t.includes('dwa')) return BOARD['hb'];
  if (t.includes('sniad') || t === 'bb') return BOARD['sniadania'];
  if (t.includes('bez')) return BOARD['bez wyzywienia'];
  return null;
};

async function travellead(terms: Record<string, unknown>): Promise<any[]> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(TL_API, {
      method: 'POST', signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', Origin: 'https://lecimynawakacje.pl', Referer: 'https://lecimynawakacje.pl/' },
      body: JSON.stringify({ terms: { regions: [], cities: [], countries: [], limit: 100, ...terms } }),
    });
    const j = await r.json();
    return Array.isArray(j.data) ? j.data : [];
  } catch { return []; } finally { clearTimeout(timer); }
}

function tlCard(o: any, lm = false): Card {
  return {
    title: o.name,
    place: /objazd/i.test(o.placeName?.[1] || '') ? `Wycieczka objazdowa, ${o.placeName[0]}` : (o.placeName || []).filter(Boolean).slice(1).reverse().concat(o.placeName?.[0] || []).slice(0, 2).join(', '),
    stars: /objazd/i.test(o.placeName?.[1] || '') ? undefined : o.category, img: o.photo ? TL_IMG + o.photo : undefined,
    from: o.departure?.label, date: o.departureDate, nights: o.duration ? o.duration - 1 : undefined, board: o.service?.label,
    pricePP: num(o.price), url: '/go/oferta/?c=asystent&u=' + encodeURIComponent(o.url), src: 'wakacje.pl', lm, hotelId: o.hotelId,
  };
}

function inRange(date: string | undefined, a: OfferArgs) {
  if (!date) return !a.od && !a.do;
  const d = date.slice(0, 10);
  if (d < today()) return false;
  if (a.od && d < a.od) return false;
  if (a.do && d > a.do) return false;
  return true;
}
const nightsOk = (n: number | undefined, a: OfferArgs) => n == null ? true : (!a.noce_min || n >= a.noce_min) && (!a.noce_max || n <= a.noce_max);
const fromOk = (f: string | undefined, a: OfferArgs) => !a.lotnisko || norm(f || '').includes(norm(a.lotnisko).slice(0, 5));

function finish(cards: Card[], a: OfferArgs, extra: Record<string, unknown>) {
  const n = a.osoby && a.osoby > 0 ? Math.min(12, Math.round(a.osoby)) : 0;
  let l = cards.filter((c) => (!a.budzet_na_osobe || (c.pricePP || 0) <= a.budzet_na_osobe) && (!a.typ || (/objazd/i.test(a.typ) ? /objazdowa/.test(c.place) : !/objazdowa/.test(c.place))));
  if (n) l = l.map((c) => ({ ...c, persons: n, priceTotal: (c.pricePP || 0) * n }));
  l = a.sortuj === 'data' ? l.sort((x, y) => (x.date || '').localeCompare(y.date || '')) : l.sort((x, y) => (x.pricePP || 0) - (y.pricePP || 0));
  // różne hotele, nie 6 terminów tego samego
  const seen = new Set<string>();
  const uniq = l.filter((c) => { const k = c.title + c.place; if (seen.has(k)) return false; seen.add(k); return true; });
  // bez wskazanego typu: po połowie objazdówek i wypoczynku, jeśli są oba rodzaje
  const obj = uniq.filter((c) => /objazdowa/.test(c.place));
  const rest = uniq.filter((c) => !/objazdowa/.test(c.place));
  const top = !a.typ && obj.length && rest.length ? [...obj.slice(0, 3), ...rest.slice(0, 3)] : uniq.slice(0, 6);
  return {
    cards: top,
    result: {
      znaleziono: l.length,
      oferty: top.map((c, i) => ({
        nr: i + 1, hotel: c.title, miejsce: c.place, gwiazdki: c.stars, wylot_z: c.from, data_wylotu: c.date, noce: c.nights,
        wyzywienie: c.board, cena_za_osobe_pln: c.pricePP, cena_razem_pln: c.priceTotal, osob: c.persons, zrodlo: c.src, link: c.url,
      })),
      rodzaje: { objazdowe: cards.filter((c) => /objazdowa/.test(c.place)).length, wypoczynek: cards.filter((c) => !/objazdowa/.test(c.place)).length },
      uwaga: top.length ? 'Karty z tymi ofertami (zdjęcie, cena, przycisk) użytkownik widzi pod Twoją odpowiedzią. Nie przepisuj wszystkich, polecaj 2 lub 3 i powiedz dlaczego. Gdy podano osoby, podaj też cenę razem.' : 'Brak ofert dla tych filtrów. Zaproponuj zmianę terminu, budżetu lub kierunku albo podaj link_wyszukiwarka.',
      ...extra,
    },
  };
}

// 3. Oferty z terminami (Exim + wakacje.pl)
export async function offers(a: OfferArgs, origin: string) {
  const p = a.kierunek ? resolvePlace(a.kierunek) : null;
  if (!p) return { cards: [], result: { blad: 'Podaj kraj lub region, np. Grecja albo Kreta.' } };
  const { c, r } = p;
  const bk = boardKey(a.wyzywienie);
  const cards: Card[] = [];

  // Exim (feed z datami, cena za 2 dorosłych)
  try {
    const res = await fetch(`${origin}/exim/${c.slug}.json`, { next: { revalidate: 3600 } } as RequestInit);
    if (res.ok) {
      const list: any[] = await res.json();
      for (const o of list) {
        if (!inRange(o.dd, a) || !nightsOk(o.nn, a) || !fromOk(o.d, a)) continue;
        if (r && !norm(o.r + ' ' + o.c).includes(norm(r.name).slice(0, 5))) continue;
        if (bk && !bk.ex.test(norm(o.b))) continue;
        const persons = o.a || 2;
        cards.push({
          title: o.n, place: [o.c, o.r].filter(Boolean).join(', '), stars: o.s, img: o.img, from: o.d, date: o.dd, nights: o.nn, board: o.b,
          pricePP: Math.round(o.p / persons), priceTotal: o.p, persons, url: `/go/exim/?k=${c.slug}&id=${encodeURIComponent(o.id)}`, src: 'Exim Tours', lm: o.lm,
        });
      }
    }
  } catch {}

  // wakacje.pl (TravelLead): bez filtra dat w API, filtrujemy tutaj
  const cid = wakacjeCountryId(c.slug);
  const rid = r ? wakacjeRegionId(c.slug, r.slug) : null;
  if (cid) {
    const terms: Record<string, unknown> = rid ? { regions: [rid] } : { countries: [cid] };
    if (bk) terms.service = [bk.tl];
    if (a.budzet_na_osobe) terms.maxPrice = a.budzet_na_osobe;
    const tl = await travellead(terms);
    for (const o of tl) {
      if (o.transport && o.transport.value !== 1) continue;
      if (r && !rid && !norm((o.placeName || []).join(' ')).includes(norm(r.name).slice(0, 5))) continue;
      const card = tlCard(o);
      if (!inRange(card.date, a) || !nightsOk(card.nights, a) || !fromOk(card.from, a)) continue;
      cards.push(card);
    }
  }

  const f: string[] = [];
  if (a.od) f.push('od-' + a.od);
  if (a.do) f.push('do-' + a.do);
  const q = new URLSearchParams({ p: (r?.wakacjePath || c.content?.wakacjePath || c.slug), f: f.join(',') });
  return finish(cards, a, {
    kierunek: r ? `${r.name} (${c.name})` : c.name,
    link_wyszukiwarka: `/go/szukaj/?${q}`,
    link_strona_ofert: `/wakacje/${c.slug}/oferty/`,
    info: 'Exim podaje cenę za 2 dorosłych, przeliczona na osobę. wakacje.pl podaje cenę za osobę.',
  });
}

// 4. Last minute
export async function lastMinute(a: { kierunek?: string; budzet_na_osobe?: number; dni?: number; lotnisko?: string }) {
  const p = a.kierunek ? resolvePlace(a.kierunek) : null;
  const terms: Record<string, unknown> = { searchType: 'lastminute' };
  if (p) {
    const cid = wakacjeCountryId(p.c.slug);
    if (!cid) return { cards: [], result: { blad: `Brak ofert last minute dla ${p.c.name}. Zaproponuj inny kierunek lub /last-minute/.` } };
    terms.countries = [cid];
  }
  if (a.budzet_na_osobe) terms.maxPrice = a.budzet_na_osobe;
  const tl = await travellead(terms);
  const to = addDays(today(), a.dni || 21);
  const cards = tl
    .filter((o) => o.placeName?.[0] !== 'Polska' && (!o.transport || o.transport.value === 1))
    .map((o) => tlCard(o, true))
    .filter((c) => c.date && c.date.slice(0, 10) >= today() && c.date.slice(0, 10) <= to && fromOk(c.from, a as OfferArgs));
  return finish(cards, { budzet_na_osobe: a.budzet_na_osobe }, { strona_last_minute: p ? `/last-minute/?kraj=${p.c.slug}` : '/last-minute/' });
}

// 5. Rejsy wycieczkowe
export async function cruises(a: { akwen?: string; od?: string; do?: string; dni_min?: number; dni_max?: number; budzet_na_osobe?: number; dojazd?: string }) {
  const terms: Record<string, unknown> = { countries: [CRUISE_COUNTRY_ID] };
  if (a.budzet_na_osobe) terms.maxPrice = a.budzet_na_osobe;
  const seen = new Set<number>();
  const pool: any[] = [];
  for (const t of [{}, { searchType: 'lastminute' }, { searchType: 'firstminute' }, { maxPrice: 6000 }]) {
    for (const o of await travellead({ ...terms, ...t })) if (!seen.has(o.id)) { seen.add(o.id); pool.push(o); }
  }
  const want = a.akwen ? CRUISE_AREAS.find((x) => norm(x.name + ' ' + x.slug + ' ' + x.short).includes(norm(a.akwen!).slice(0, 6)))?.slug || areaOf(a.akwen) : '';
  const cards: Card[] = [];
  for (const o of pool) {
    const area = areaOf(o.name, (o.placeName || []).slice(1).join(' '));
    if (want && area !== want) continue;
    if (a.dni_min && o.duration < a.dni_min) continue;
    if (a.dni_max && o.duration > a.dni_max) continue;
    if (a.dojazd && (norm(a.dojazd).includes('wlas') ? o.transport?.value === 1 : o.transport?.value !== 1)) continue;
    const { ship, route } = splitName(o.name);
    const c = tlCard(o);
    c.title = route;
    c.place = [lineOf(o.name), ship, o.placeName?.[2] ? 'start: ' + o.placeName[2] : ''].filter(Boolean).join(' · ');
    c.nights = o.duration ? o.duration - 1 : undefined;
    c.from = o.transport?.value === 1 ? o.departure?.label : 'dojazd własny';
    c.stars = undefined;
    if (!inRange(c.date, a as OfferArgs)) continue;
    cards.push(c);
  }
  return finish(cards, { budzet_na_osobe: a.budzet_na_osobe }, {
    akweny: CRUISE_AREAS.map((x) => ({ nazwa: x.name, link: `/rejsy/${x.slug}/`, kiedy: x.when })),
    strona_rejsow: want ? `/rejsy/${want}/` : '/rejsy/',
    info: 'Cena za osobę przy 2 osobach w kabinie. W polu hotel jest trasa rejsu, w polu miejsce armator, statek i port startowy.',
  });
}

export const TOOL_DECLARATIONS = [
  {
    name: 'przewodnik',
    description: 'Dane z przewodnika portalu o kraju lub regionie: kiedy jechać, klimat miesiąc po miesiącu, regiony, atrakcje z linkami do wycieczek, praktyczne informacje, eSIM, linki. Używaj przed planowaniem wyjazdu i przy pytaniach o kierunek.',
    parameters: { type: 'object', properties: { kierunek: { type: 'string', description: 'Kraj lub region po polsku, np. "Grecja", "Kreta", "Wyspy Kanaryjskie"' } }, required: ['kierunek'] },
  },
  {
    name: 'propozycje_kierunkow',
    description: 'Ciepłe kierunki na dany miesiąc z temperaturą powietrza i morza. Gdy użytkownik nie wie, dokąd jechać.',
    parameters: { type: 'object', properties: { miesiac: { type: 'integer', description: 'Numer miesiąca 1-12' } }, required: ['miesiac'] },
  },
  {
    name: 'szukaj_ofert',
    description: 'Prawdziwe oferty biur podróży (Exim Tours i wakacje.pl): wypoczynek w hotelach i wycieczki objazdowe, z datą wylotu, liczbą nocy, wyżywieniem, miastem wylotu i ceną za osobę. Używaj zawsze, gdy użytkownik chce gdzieś jechać, nawet bez podanego terminu.',
    parameters: {
      type: 'object',
      properties: {
        kierunek: { type: 'string', description: 'Kraj lub region po polsku' },
        od: { type: 'string', description: 'Najwcześniejsza data wylotu YYYY-MM-DD' },
        do: { type: 'string', description: 'Najpóźniejsza data wylotu YYYY-MM-DD' },
        noce_min: { type: 'integer' },
        noce_max: { type: 'integer' },
        wyzywienie: { type: 'string', description: 'all inclusive, hb, sniadania, bez wyzywienia' },
        lotnisko: { type: 'string', description: 'Miasto wylotu, np. Katowice, Warszawa' },
        budzet_na_osobe: { type: 'integer', description: 'Maksymalna cena za osobę w PLN' },
        sortuj: { type: 'string', enum: ['cena', 'data'] },
        osoby: { type: 'integer', description: 'Liczba osób (do ceny razem)' },
        typ: { type: 'string', enum: ['objazdowa', 'wypoczynek'], description: 'Wycieczka objazdowa (zwiedzanie z przewodnikiem) albo wypoczynek w hotelu. Puste = wszystko' },
      },
      required: ['kierunek'],
    },
  },
  {
    name: 'last_minute',
    description: 'Oferty last minute z wylotem w najbliższych dniach, opcjonalnie dla kraju i budżetu.',
    parameters: {
      type: 'object',
      properties: {
        kierunek: { type: 'string', description: 'Kraj po polsku, puste = wszystkie' },
        budzet_na_osobe: { type: 'integer' },
        dni: { type: 'integer', description: 'Wylot w ciągu ilu dni, domyślnie 21' },
        lotnisko: { type: 'string' },
      },
    },
  },
  {
    name: 'rejsy',
    description: 'Rejsy wycieczkowe (MSC, Costa) z polskich biur: trasa, statek, port startowy, termin, długość, cena za osobę. Akweny: Morze Śródziemne, Karaiby, Fiordy i Europa Północna, Wyspy Kanaryjskie, Dalekie rejsy.',
    parameters: {
      type: 'object',
      properties: {
        akwen: { type: 'string', description: 'Np. Morze Śródziemne, Karaiby, fiordy, Kanary, dalekie' },
        od: { type: 'string', description: 'Najwcześniejsza data wypłynięcia YYYY-MM-DD' },
        do: { type: 'string', description: 'Najpóźniejsza data wypłynięcia YYYY-MM-DD' },
        dni_min: { type: 'integer' },
        dni_max: { type: 'integer' },
        budzet_na_osobe: { type: 'integer' },
        dojazd: { type: 'string', description: 'samolot albo wlasny' },
      },
    },
  },
];

export async function runTool(name: string, args: any, origin: string): Promise<{ result: unknown; cards?: Card[] }> {
  switch (name) {
    case 'przewodnik': return { result: guide(args) };
    case 'propozycje_kierunkow': return { result: suggest(args) };
    case 'szukaj_ofert': return offers(args, origin);
    case 'last_minute': return lastMinute(args);
    case 'rejsy': return cruises(args);
    default: return { result: { blad: 'Nieznane narzędzie' } };
  }
}
