'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useHotelPages } from './useHotelPages';
import { normName } from '@/lib/hotelmatch';

// Jedna wyszukiwarka ofert na stronie kraju: wakacje.pl (TravelLead, wiele biur) + Exim Tours (feed).
// Oba źródła sprowadzamy do jednego formatu, a filtry i sortowanie działają na wspólnej liście.

const API = 'https://widget.wakacje.pl/v2/api/widgets/offers';
const IMG = 'https://i.wakacje.pl';

type TL = {
  id: number; hotelId?: number; name: string; price: string; priceOld: string; departureDate: string; returnDate: string; category: number;
  departure?: { label: string; urlName: string }; service?: { label: string; value: number; urlName: string }; transport?: { value: number };
  placeName: string[]; photo: string; tourOperatorName: string; ratingValue: number; ratingRecommends: number; promos?: string[]; url: string;
};
type EX = { id: string; n: string; c: string; r: string; s: number; d: string; dd: string; rd: string; nn: number; b: string; bc: string; a: number; k: number; p: number; pp: number; lm: boolean; img: string; u: string };

type U = {
  key: string; src: 'wakacje' | 'exim'; hotel: string; stars: number; region: string; city: string;
  from: string; date: string; ret: string; nights: number; board: string; boardLabel: string;
  pp: number; old: number; rating: number; opinions: number; operator: string; img: string; promo: string;
  card: string; aff: string;
};

const BOARDS = [
  { v: '', label: 'Dowolne wyżywienie' },
  { v: 'ai', label: 'All inclusive' },
  { v: 'fb', label: 'Pełne wyżywienie' },
  { v: 'hb', label: 'Śniadania i obiadokolacje' },
  { v: 'bb', label: 'Śniadania' },
  { v: 'ro', label: 'Bez wyżywienia' },
];
const LEN = [
  { v: '', label: 'Dowolna długość' },
  { v: '1-5', label: 'do 5 nocy' },
  { v: '6-8', label: '6-8 nocy' },
  { v: '9-11', label: '9-11 nocy' },
  { v: '12-99', label: '12+ nocy' },
];
const PRICES = ['', '2000', '3000', '4000', '5000', '7000', '10000'];
const SORTS = [
  { v: 'price', label: 'Najtańsze' },
  { v: 'date', label: 'Najbliższy wylot' },
  { v: 'rating', label: 'Najlepiej oceniane' },
  { v: 'stars', label: 'Najwyższy standard' },
];
const PROMO: Record<string, string> = { firstminute: 'First minute', lastminute: 'Last minute', top10: 'Top 10', top10kids: 'Dla rodzin', new: 'Nowość' };

const num = (p: string) => Number(String(p).replace(/\s/g, '').replace(',', '.')) || 0;
const fmt = (n: number) => n.toLocaleString('pl-PL');
const dm = (d: string) => d.slice(8, 10) + '.' + d.slice(5, 7);
const nightsBetween = (a: string, b: string) => Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / 86400000));
const nocy = (n: number) => `${n} ${n === 1 ? 'noc' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'noce' : 'nocy'}`;
const ofert = (n: number) => (n === 1 ? 'oferta' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'oferty' : 'ofert');

function boardOf(label: string, code?: string): string {
  const s = `${code || ''} ${label}`.toLowerCase();
  if (/\b(u?ai|all inclusive|all incl)/.test(s)) return 'ai';
  if (/\bfb\b|pełne/.test(s)) return 'fb';
  if (/\bhb\b|obiadokolac|dwa posiłki/.test(s)) return 'hb';
  if (/\bbb\b|śniadani/.test(s)) return 'bb';
  if (/\bro\b|\bov\b|bez wyżyw|własne/.test(s)) return 'ro';
  return 'other';
}

async function loadWakacje(countryId: number): Promise<TL[]> {
  const call = (t: Record<string, unknown>) => fetch(API, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ terms: { limit: 100, countries: [countryId], regions: [], cities: [], ...t } }),
  }).then((r) => r.json()).then((j) => (Array.isArray(j.data) ? j.data as TL[] : [])).catch(() => [] as TL[]);
  const lists = await Promise.all([call({}), call({ service: [1] }), call({ searchType: 'lastminute' }), call({ service: [2] }), call({ service: [3] })]);
  const m = new Map<number, TL>();
  for (const o of lists.flat()) if (!m.has(o.id)) m.set(o.id, o);
  return [...m.values()];
}

// słowa zbyt ogólne, żeby po nich dopasować region (np. "Costa", "Wyspa")
const GENERIC = new Set(['costa', 'wyspa', 'wyspy', 'riwiera', 'riviera', 'wybrzeze', 'region', 'okolice', 'polwysep', 'zatoka', 'island', 'islands', 'coast', 'north', 'south', 'polnocne', 'poludniowe', 'port', 'playa', 'beach', 'city', 'miasto']);
const tokens = (s: string) => normName(s).split(' ').filter((w) => w.length > 3 && !GENERIC.has(w));
const stemEq = (a: string, b: string) => a === b || (a.length >= 5 && b.length >= 5 && a.slice(0, 5) === b.slice(0, 5));

export default function OfferSearch({ slug, countryId, wakacjePath, loc, regionHint, regionLoc }: { slug: string; countryId?: number; wakacjePath: string; loc: string; regionHint?: string[]; regionLoc?: string }) {
  const hinted = useRef(false);
  const hp = useHotelPages();
  const [all, setAll] = useState<U[] | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [len, setLen] = useState('');
  const [board, setBoard] = useState('');
  const [dep, setDep] = useState('');
  const [region, setRegion] = useState('');
  const [op, setOp] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('price');
  const [shown, setShown] = useState(12);

  useEffect(() => {
    let cancel = false;
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      countryId ? loadWakacje(countryId) : Promise.resolve([] as TL[]),
      fetch(`/exim/${slug}.json`).then((r) => (r.ok ? r.json() : [])).catch(() => []) as Promise<EX[]>,
    ]).then(([tl, ex]) => {
      if (cancel) return;
      const a: U[] = tl
        .filter((o) => (!o.transport || o.transport.value === 1) && o.departureDate >= today && !/objazd/i.test(o.placeName?.[1] || ''))
        .map((o) => ({
          key: 't' + o.id, src: 'wakacje', hotel: o.name, stars: o.category || 0, region: o.placeName?.[1] || '', city: o.placeName?.[2] || '',
          from: o.departure?.label || '', date: o.departureDate, ret: o.returnDate, nights: nightsBetween(o.departureDate, o.returnDate),
          board: boardOf(o.service?.label || ''), boardLabel: o.service?.label || '', pp: num(o.price), old: num(o.priceOld),
          rating: o.ratingValue || 0, opinions: o.ratingRecommends || 0, operator: o.tourOperatorName || 'wakacje.pl',
          img: o.photo ? IMG + o.photo : '', promo: PROMO[o.promos?.[0] || ''] || '',
          card: o.hotelId ? String(o.hotelId) : '', aff: '/go/oferta/?u=' + encodeURIComponent(o.url),
        }));
      const b: U[] = (Array.isArray(ex) ? ex : []).filter((o) => o.dd >= today).map((o) => {
        const people = Math.max(1, (o.a || 0) + (o.k || 0));
        return {
          key: 'x' + o.id, src: 'exim', hotel: o.n, stars: o.s || 0, region: o.r || '', city: o.c || '',
          from: o.d, date: o.dd, ret: o.rd, nights: o.nn, board: boardOf(o.b, o.bc), boardLabel: o.b,
          pp: Math.round(o.p / people), old: o.pp > o.p ? Math.round(o.pp / people) : 0, rating: 0, opinions: 0, operator: 'Exim Tours',
          img: o.img, promo: o.lm ? 'Last minute' : '', card: `x:${slug}:${normName(o.n)}`, aff: '/go/exim/?u=' + encodeURIComponent(o.u),
        };
      });
      setAll([...a, ...b].filter((o) => o.pp > 0));
    });
    return () => { cancel = true; };
  }, [slug, countryId]);

  // listy do filtrów (z liczbą ofert)
  const opts = (f: (o: U) => string) => {
    const m = new Map<string, { label: string; n: number }>();
    for (const o of all || []) {
      const label = f(o);
      if (!label) continue;
      const k = normName(label);
      const cur = m.get(k);
      m.set(k, { label: cur?.label || label, n: (cur?.n || 0) + 1 });
    }
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n);
  };
  const regions = useMemo(() => opts((o) => o.region), [all]); // eslint-disable-line react-hooks/exhaustive-deps
  const deps = useMemo(() => opts((o) => o.from.split(/\s+-\s+/)[0]), [all]); // eslint-disable-line react-hooks/exhaustive-deps
  const ops = useMemo(() => opts((o) => o.operator), [all]); // eslint-disable-line react-hooks/exhaustive-deps

  // strona regionu: oferty z tego regionu albo miejscowości (nazwy w źródłach się różnią, więc dopasowanie jest przybliżone)
  const hintTokens = useMemo(() => (regionHint || []).flatMap(tokens), [regionHint]);
  const hintFull = useMemo(() => (regionHint || []).map(normName).filter(Boolean), [regionHint]);
  const inHint = (o: U) => {
    const parts = [o.region, o.city];
    if (hintTokens.length) return parts.some((p) => tokens(p).some((t) => hintTokens.some((w) => stemEq(t, w))));
    return parts.some((p) => { const n = normName(p); return !!n && hintFull.some((h) => n.includes(h) || h.includes(n)); });
  };
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (hinted.current || !all || !regionHint?.length) return;
    hinted.current = true;
    if (all.some(inHint)) setNear(true);
  }, [all]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = useMemo(() => {
    const [lo, hi] = len ? len.split('-').map(Number) : [0, 999];
    const l = (all || []).filter((o) =>
      (!from || o.date >= from) && (!to || o.date <= to) && o.nights >= lo && o.nights <= hi &&
      (!board || o.board === board) && (!dep || normName(o.from.split(/\s+-\s+/)[0]) === dep) &&
      (!near || inHint(o)) && (!region || normName(o.region) === region) && (!op || normName(o.operator) === op) && (!maxPrice || o.pp <= Number(maxPrice)));
    const by: Record<string, (a: U, b: U) => number> = {
      price: (a, b) => a.pp - b.pp,
      date: (a, b) => a.date.localeCompare(b.date) || a.pp - b.pp,
      rating: (a, b) => b.rating - a.rating || a.pp - b.pp,
      stars: (a, b) => b.stars - a.stars || a.pp - b.pp,
    };
    return [...l].sort(by[sort]);
  }, [all, from, to, len, board, dep, region, op, maxPrice, sort, near]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setShown(12); }, [from, to, len, board, dep, region, op, maxPrice, sort, near]);

  function searchMore() {
    const f: string[] = [];
    if (from) f.push('od-' + from);
    if (to) f.push('do-' + to);
    f.push('samolotem');
    const q = new URLSearchParams({ p: wakacjePath, f: f.join(',') });
    window.open('/go/szukaj/?' + q.toString(), '_blank', 'noopener');
  }

  const nOps = ops.length;
  return (
    <section className="ob" id="oferty">
      <div className="ob-head">
        <h2>{regionLoc && near ? `Oferty wakacji ${regionLoc}` : `Wyszukiwarka wakacji ${loc}`}</h2>
        <p className="muted">
          Porównujemy oferty {nOps > 1 ? `${nOps} biur podróży` : 'biur podróży'} w jednym miejscu. Ceny za osobę za cały pobyt z przelotem.
        </p>
      </div>

      <div className="ob-filters os-filters">
        <label>Wylot od<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>Wylot do<input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
        <label>Długość
          <select value={len} onChange={(e) => setLen(e.target.value)}>{LEN.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}</select>
        </label>
        <label>Wyżywienie
          <select value={board} onChange={(e) => setBoard(e.target.value)}>{BOARDS.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}</select>
        </label>
        <label>Wylot z
          <select value={dep} onChange={(e) => setDep(e.target.value)}>
            <option value="">Każde lotnisko</option>
            {deps.map(([k, x]) => <option key={k} value={k}>{x.label} ({x.n})</option>)}
          </select>
        </label>
        {regions.length > 1 && (
          <label>Region
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="">Wszystkie regiony</option>
              {regions.map(([k, x]) => <option key={k} value={k}>{x.label} ({x.n})</option>)}
            </select>
          </label>
        )}
        {nOps > 1 && (
          <label>Biuro podróży
            <select value={op} onChange={(e) => setOp(e.target.value)}>
              <option value="">Wszystkie biura</option>
              {ops.map(([k, x]) => <option key={k} value={k}>{x.label} ({x.n})</option>)}
            </select>
          </label>
        )}
        <label>Cena do
          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
            {PRICES.map((p) => <option key={p} value={p}>{p ? fmt(Number(p)) + ' zł' : 'Dowolna'}</option>)}
          </select>
        </label>
        <label>Sortuj
          <select value={sort} onChange={(e) => setSort(e.target.value)}>{SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}</select>
        </label>
      </div>

      {all === null && <div className="ob-empty">Wczytujemy oferty biur podróży...</div>}
      {all !== null && (
        <div className="ob-count">
          {list.length} {ofert(list.length)}{from || to ? ' w wybranym terminie' : ''}
          {regionLoc && near && <button type="button" className="os-near" onClick={() => setNear(false)}>tylko {regionLoc.replace(/^(w|we|na)\s+/, '')} &times;</button>}
          {regionLoc && !near && regionHint?.length && all.some(inHint) && <button type="button" className="os-near off" onClick={() => setNear(true)}>pokaż tylko {regionLoc.replace(/^(w|we|na)\s+/, '')}</button>}
        </div>
      )}
      {all !== null && list.length === 0 && (
        <div className="ob-empty">Brak ofert dla wybranych filtrów. Zmień filtry albo <button type="button" className="linkbtn" onClick={searchMore}>szukaj w pełnej bazie wakacje.pl</button>.</div>
      )}

      {list.length > 0 && (
        <ul className="ob-list">
          {list.slice(0, shown).map((o) => {
            const page = o.card ? hp[o.card] : '';
            const link = page ? { href: `/hotel/${page}/` } : { href: o.aff, target: '_blank', rel: 'sponsored nofollow noopener' };
            return (
              <li key={o.key}>
                <a className="ob-card" {...link}>
                  <div className="ob-img">
                    {o.img && <img src={o.img} alt={o.hotel} loading="lazy" />}
                    {o.promo && <span className={'ob-promo' + (o.promo === 'Last minute' ? ' hot' : '')}>{o.promo}</span>}
                  </div>
                  <div className="ob-body">
                    <span className="ob-place">{[o.region, o.city].filter((x, i, a) => x && a.indexOf(x) === i).join(' / ')}</span>
                    <h3>{o.hotel}</h3>
                    {o.stars > 0 && <span className="ob-stars" aria-label={`Standard ${o.stars} gwiazdki`}>{'★'.repeat(Math.round(o.stars))}</span>}
                    <ul className="ob-meta">
                      <li>{dm(o.date)} - {dm(o.ret)}.{o.ret.slice(0, 4)} ({nocy(o.nights)})</li>
                      <li>Wylot: {o.from}</li>
                      <li>{o.boardLabel}</li>
                    </ul>
                    <span className="os-op">{o.operator}</span>
                  </div>
                  <div className="ob-side">
                    {o.rating > 0 && <span className="ob-rating"><b>{o.rating.toFixed(1)}</b> {o.opinions} opinii</span>}
                    {o.old > o.pp && <s className="ob-old">{fmt(o.old)} zł</s>}
                    <span className="ob-price">{fmt(o.pp)} zł</span>
                    <span className="ob-pp">za osobę</span>
                    <span className="btn btn-sm">{page ? 'Zobacz hotel' : 'Zobacz ofertę'}</span>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {shown < list.length && <button type="button" className="btn btn-ghost ob-more" onClick={() => setShown((s) => s + 12)}>Pokaż więcej ofert</button>}
      {all !== null && (
        <p className="muted" style={{ fontSize: '0.88rem', marginTop: 14 }}>
          Nie ma Twojego terminu? <button type="button" className="linkbtn" onClick={searchMore}>Szukaj {from || to ? 'w tym terminie ' : ''}w pełnej bazie wakacje.pl</button> (kilkadziesiąt biur podróży).
        </p>
      )}
    </section>
  );
}
