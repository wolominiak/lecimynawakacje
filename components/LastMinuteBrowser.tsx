'use client';
import { useHotelPages } from './useHotelPages';
import { useEffect, useMemo, useState } from 'react';

// Last minute: oferty z wylotem w najbliższych tygodniach (API widgetu TravelLead, searchType "lastminute").
// Pobieramy ogólną pulę + osobno popularne kraje, łączymy i filtrujemy tutaj, więc filtry działają od razu.

const API = 'https://widget.wakacje.pl/v2/api/widgets/offers';
const IMG = 'https://i.wakacje.pl';

type Offer = {
  hotelId?: number;
  transport?: { label: string; value: number };
  id: number; name: string; price: string; priceOld: string; priceDiscount: number; duration: number;
  departureDate: string; returnDate: string; category: number;
  departure: { label: string; urlName: string; value: number };
  service: { label: string; urlName: string; value: number };
  placeName: string[]; photo: string; tourOperatorName: string; ratingValue: number; ratingRecommends: number; url: string;
};

export type LmCountry = { id: number; name: string; slug: string };

/** Ustawienia wyszukiwarki dla kategorii (last minute, all inclusive, egzotyka...) */
export type DealCfg = {
  mode: 'lastminute' | 'all';   // lastminute: wylot w najbliższych dniach, all: wszystkie terminy (filtr miesięcy)
  service?: number;             // stałe wyżywienie (1 = all inclusive)
  maxPrice?: number;            // stały limit ceny za osobę
  kind?: 'objazd' | 'wypoczynek';
  label: string;                // "last minute", "all inclusive"...
  cmp: string;                  // znacznik w linku /go/oferta/?c=
  allLink: string;              // link "zobacz wszystkie na wakacje.pl"
  source?: string;              // gotowa lista ofert (JSON z GitHub Actions) zamiast zapytań do API
};
const LM_CFG: DealCfg = { mode: 'lastminute', label: 'last minute', cmp: 'last-minute', allLink: '/go/last-minute/' };
const isObjazd = (o: { placeName: string[] }) => /objazd/i.test(o.placeName?.[1] || '');
const monthKey = (d: string) => d.slice(0, 7);
const monthLabel = (k: string) => new Date(k + '-15T12:00:00').toLocaleDateString('pl-PL', { month: 'short', year: 'numeric' });

const WHEN = [
  { v: 3, label: 'do 3 dni' },
  { v: 7, label: 'do tygodnia' },
  { v: 14, label: 'do 2 tygodni' },
  { v: 0, label: 'dowolnie' },
];
const SERVICE = [
  { v: 0, label: 'Wszystkie' },
  { v: 1, label: 'All inclusive' },
  { v: 2, label: 'HB' },
  { v: 3, label: 'Śniadania' },
];
const LENGTH = [
  { v: '', label: 'Każda' },
  { v: 's', label: 'do 7 dni' },
  { v: 'm', label: '8-10 dni' },
  { v: 'l', label: '11+ dni' },
];
const BUDGETS = [1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 8000, 10000];
const SORTS = [
  { v: 'price', label: 'Najtańsze' },
  { v: 'soon', label: 'Najszybszy wylot' },
  { v: 'rating', label: 'Najlepiej oceniane' },
  { v: 'stars', label: 'Najwyższy standard' },
];

const num = (p: string) => Number(String(p).replace(/\s/g, '')) || 0;
const fmt = (n: number) => n.toLocaleString('pl-PL');
const day = 86400000;
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const daysTo = (iso: string) => Math.round((new Date(iso + 'T00:00:00').getTime() - today()) / day);
const fmtDate = (d: string) => d.slice(8, 10) + '.' + d.slice(5, 7);
const ofert = (n: number) => (n === 1 ? 'oferta' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'oferty' : 'ofert');

async function load(terms: Record<string, unknown>, cfg: DealCfg): Promise<Offer[]> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(API, {
      method: 'POST',
      signal: ctl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terms: {
        regions: [], cities: [], countries: [],
        ...(cfg.mode === 'lastminute' ? { searchType: 'lastminute' } : {}),
        ...(cfg.service ? { service: [cfg.service] } : {}),
        ...(cfg.maxPrice ? { maxPrice: cfg.maxPrice } : {}),
        ...terms,
      } }),
    });
    const j = await r.json();
    return Array.isArray(j.data) ? j.data : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export default function LastMinuteBrowser({ countries, initialCountry = '', cfg = LM_CFG, globalPool = true }: { countries: LmCountry[]; initialCountry?: string; cfg?: DealCfg; globalPool?: boolean }) {
  const hp = useHotelPages();
  const lm = cfg.mode === 'lastminute';
  const [month, setMonth] = useState('');
  const [pool, setPool] = useState<Offer[] | null>(null);
  const [country, setCountry] = useState(initialCountry);
  const [when, setWhen] = useState(0);
  const [service, setService] = useState(0);
  const [length, setLength] = useState('');
  const [budget, setBudget] = useState(0); // 0 = bez limitu
  const [airport, setAirport] = useState('');
  const [sort, setSort] = useState('price');
  const [shown, setShown] = useState(12);
  const [done, setDone] = useState(false);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    // ?kraj=egipt w adresie ustawia filtr (linki z innych stron)
    const k = new URLSearchParams(window.location.search).get('kraj');
    if (k) { const c = countries.find((x) => x.slug === k); if (c) setCountry(c.name); }
    let cancel = false;
    const seen = new Set<number>();
    const all: Offer[] = [];
    const add = (l: Offer[]) => {
      if (cancel) return;
      for (const o of l) {
        if (seen.has(o.id) || daysTo(o.departureDate) < 0 || o.placeName?.[0] === 'Polska' || (o.transport && o.transport.value !== 1)) continue;
        if (cfg.kind === 'objazd' && !isObjazd(o)) continue;
        if (cfg.kind === 'wypoczynek' && isObjazd(o)) continue;
        seen.add(o.id); all.push(o);
      }
      setPool([...all]);
    };
    // najpierw ogólna pula, potem kraje po kilka naraz; wyniki pokazujemy, gdy tylko przyjdą
    (async () => {
      if (cfg.source) {
        try { const r = await fetch(cfg.source, { cache: 'no-store' }); if (!r.ok) throw new Error(String(r.status)); const j = await r.json(); add(Array.isArray(j.offers) ? j.offers : []); } catch { if (!cancel) { setLoadErr(true); add([]); } }
        if (!cancel) setDone(true);
        return;
      }
      if (globalPool) add(await load({ limit: 100 }, cfg));
      const queue = [...countries];
      const per = lm ? 30 : 40;
      const worker = async () => { while (queue.length && !cancel) { const c = queue.shift()!; add(await load({ limit: per, countries: [c.id] }, cfg)); } };
      await Promise.all([worker(), worker(), worker(), worker()]);
      if (!cancel) setDone(true);
    })();
    return () => { cancel = true; };
  }, [countries]);

  const maxPrice = useMemo(() => Math.ceil(Math.max(0, ...(pool || []).map((o) => num(o.price))) / 500) * 500, [pool]);
  const minPrice = useMemo(() => Math.min(...(pool || []).map((o) => num(o.price)).filter(Boolean), Infinity), [pool]);

  // wszystkie filtry poza danym, żeby liczniki przy opcjach były sensowne
  const pass = (o: Offer, skip?: string) =>
    (skip === 'country' || !country || o.placeName[0] === country) &&
    (skip === 'when' || !when || daysTo(o.departureDate) <= when) &&
    (skip === 'month' || !month || monthKey(o.departureDate) === month) &&
    (skip === 'service' || !service || o.service?.value === service) &&
    (skip === 'length' || !length || (length === 's' ? o.duration <= 7 : length === 'm' ? o.duration >= 8 && o.duration <= 10 : o.duration >= 11)) &&
    (skip === 'budget' || !budget || num(o.price) <= budget) &&
    (skip === 'airport' || !airport || o.departure?.urlName === airport);

  const countryCounts = useMemo(() => {
    const m = new Map<string, number>();
    (pool || []).filter((o) => pass(o, 'country')).forEach((o) => m.set(o.placeName[0], (m.get(o.placeName[0]) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, when, month, service, length, budget, airport]);

  const months = useMemo(() => {
    const m = new Map<string, number>();
    (pool || []).filter((o) => pass(o, 'month')).forEach((o) => { const k = monthKey(o.departureDate); m.set(k, (m.get(k) || 0) + 1); });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, country, service, length, budget, airport]);

  const airports = useMemo(() => {
    const m = new Map<string, { label: string; n: number }>();
    (pool || []).filter((o) => pass(o, 'airport')).forEach((o) => { const a = o.departure; if (a?.urlName) m.set(a.urlName, { label: a.label, n: (m.get(a.urlName)?.n || 0) + 1 }); });
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, country, when, month, service, length, budget]);

  const list = useMemo(() => {
    const l = (pool || []).filter((o) => pass(o));
    const by: Record<string, (a: Offer, b: Offer) => number> = {
      price: (a, b) => num(a.price) - num(b.price),
      soon: (a, b) => a.departureDate.localeCompare(b.departureDate) || num(a.price) - num(b.price),
      rating: (a, b) => (b.ratingValue || 0) - (a.ratingValue || 0),
      stars: (a, b) => (b.category || 0) - (a.category || 0) || num(a.price) - num(b.price),
    };
    return l.sort(by[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, country, when, month, service, length, budget, airport, sort]);

  useEffect(() => { setShown(12); }, [country, when, month, service, length, budget, airport, sort]);

  const reset = () => { setCountry(''); setWhen(0); setMonth(''); setService(0); setLength(''); setBudget(0); setAirport(''); };
  const active = !!(country || when || month || service || length || budget || airport);

  return (
    <div className="lm">
      <div className="lm-panel lm-form">
        {lm ? (
          <label><span className="lm-label">Wylot</span>
            <select value={when} onChange={(e) => setWhen(Number(e.target.value))}>
              {WHEN.map((w) => <option key={w.v} value={w.v}>{w.label}</option>)}
            </select>
          </label>
        ) : (
          <label><span className="lm-label">Miesiąc wylotu</span>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">Dowolny</option>
              {months.map(([k, n]) => <option key={k} value={k}>{monthLabel(k)} ({n})</option>)}
            </select>
          </label>
        )}
        <label><span className="lm-label">Kierunek</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Wszystkie kraje</option>
            {countryCounts.map(([c, n]) => <option key={c} value={c}>{c} ({n})</option>)}
          </select>
        </label>
        {!cfg.service && (
          <label><span className="lm-label">Wyżywienie</span>
            <select value={service} onChange={(e) => setService(Number(e.target.value))}>
              {SERVICE.map((x) => <option key={x.v} value={x.v}>{x.v ? x.label : 'Dowolne'}</option>)}
            </select>
          </label>
        )}
        <label><span className="lm-label">Długość pobytu</span>
          <select value={length} onChange={(e) => setLength(e.target.value)}>
            {LENGTH.map((x) => <option key={x.v} value={x.v}>{x.v ? x.label : 'Dowolna'}</option>)}
          </select>
        </label>
        <label><span className="lm-label">Budżet na osobę</span>
          <select value={budget} onChange={(e) => setBudget(Number(e.target.value))}>
            <option value={0}>Bez limitu</option>
            {BUDGETS.filter((v) => !cfg.maxPrice || v <= cfg.maxPrice).map((v) => <option key={v} value={v}>do {fmt(v)} zł</option>)}
          </select>
        </label>
        <label><span className="lm-label">Wylot z</span>
          <select value={airport} onChange={(e) => setAirport(e.target.value)}>
            <option value="">Każde lotnisko</option>
            {airports.map(([k, a]) => <option key={k} value={k}>{a.label} ({a.n})</option>)}
          </select>
        </label>
        <label><span className="lm-label">Sortuj</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}
          </select>
        </label>
      </div>

      {pool === null && <div className="ob-empty">Szukamy ofert {cfg.label} w kilkudziesięciu biurach podróży...</div>}
      {pool !== null && (
        <div className="lm-bar">
          <span><b>{list.length}</b> {ofert(list.length)} {cfg.label}{country ? ` - ${country}` : ''}{!done && <small className="lm-loading"> wczytujemy kolejne biura...</small>}</span>
          {active && <button type="button" className="lm-reset" onClick={reset}>Wyczyść filtry</button>}
        </div>
      )}
      {pool !== null && list.length === 0 && loadErr && (
        <div className="ob-empty">
          Nie udało się wczytać ofert. Odśwież stronę za chwilę albo{' '}
          <a href={cfg.allLink} target="_blank" rel="sponsored nofollow noopener">zobacz oferty na wakacje.pl</a>.
        </div>
      )}
      {pool !== null && list.length === 0 && !loadErr && (
        <div className="ob-empty">
          Brak ofert dla wybranych filtrów. <button type="button" className="lm-reset" onClick={reset}>Wyczyść filtry</button> albo{' '}
          <a href={cfg.allLink} target="_blank" rel="sponsored nofollow noopener">zobacz wszystkie oferty na wakacje.pl</a>.
        </div>
      )}

      {pool !== null && list.length > 0 && (
        <>
          <ul className="ob-list">
            {list.slice(0, shown).map((o) => {
              const price = num(o.price);
              const old = num(o.priceOld);
              const d = daysTo(o.departureDate);
              return (
                <li key={o.id}>
                  <a className="ob-card" {...(hp[o.hotelId ?? 0] ? { href: `/hotel/${hp[o.hotelId ?? 0]}/` } : { href: `/go/oferta/?c=${cfg.cmp}&u=` + encodeURIComponent(o.url), target: '_blank', rel: 'sponsored nofollow noopener' })}>
                    <div className="ob-img">
                      {o.photo && <img src={IMG + o.photo} alt={o.name} loading="lazy" />}
                      {lm || d <= 14
                        ? <span className={'ob-promo' + (d <= 3 ? ' hot' : '')}>{d === 0 ? 'Wylot dziś' : d === 1 ? 'Wylot jutro' : `Wylot za ${d} dni`}</span>
                        : isObjazd(o) ? <span className="ob-promo">Objazd</span> : null}
                    </div>
                    <div className="ob-body">
                      <span className="ob-place">{o.placeName.join(' / ')}</span>
                      <h3>{o.name}</h3>
                      {!isObjazd(o) && <span className="ob-stars" aria-label={`Standard ${o.category} gwiazdki`}>{'★'.repeat(Math.round(o.category || 0))}</span>}
                      <ul className="ob-meta">
                        <li>{fmtDate(o.departureDate)} - {fmtDate(o.returnDate)} ({o.duration} dni)</li>
                        <li>Wylot: {o.departure?.label}</li>
                        <li>{o.service?.label}</li>
                        <li>{o.tourOperatorName}</li>
                      </ul>
                    </div>
                    <div className="ob-side">
                      {o.ratingValue > 0 && <span className="ob-rating"><b>{o.ratingValue.toFixed(1)}</b> {o.ratingRecommends} opinii</span>}
                      {old > price && <s className="ob-old">{fmt(old)} zł</s>}
                      <span className="ob-price">{fmt(price)} zł</span>
                      <span className="ob-pp">za osobę</span>
                      <span className="btn btn-sm">Zobacz ofertę</span>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
          {shown < list.length && <button type="button" className="btn btn-ghost ob-more" onClick={() => setShown((s) => s + 12)}>Pokaż więcej ofert</button>}
        </>
      )}
    </div>
  );
}
