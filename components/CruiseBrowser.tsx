'use client';
import { useEffect, useMemo, useState } from 'react';
import { CRUISE_AREAS, CRUISE_COUNTRY_ID, areaOf, lineOf, splitName } from '@/lib/cruises';

// Rejsy z wakacje.pl (API widgetu TravelLead). API zwraca max 100 ofert na zapytanie,
// więc łączymy kilka zapytań (last/first minute, budżety, wyżywienie) i usuwamy duplikaty.
const API = 'https://widget.wakacje.pl/v2/api/widgets/offers';
const IMG = 'https://i.wakacje.pl';

type Offer = {
  id: number; name: string; price: string; priceOld: string; duration: number;
  departureDate: string; returnDate: string; category: number;
  transport?: { label: string; value: number };
  departure: { label: string; urlName: string };
  service: { label: string; value: number };
  placeName: string[]; photo: string; tourOperatorName: string; url: string;
  promoLastMinute?: boolean; promoFirstMinute?: boolean;
};
type Row = Offer & { area: string; line: string; ship: string; route: string; port: string; p: number };

const num = (s: string) => Number(String(s).replace(/[^\d]/g, '')) || 0;
const fmt = (n: number) => n.toLocaleString('pl-PL');
const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
const monthKey = (d: string) => d.slice(0, 7);
const monthLabel = (k: string) => new Date(k + '-15T12:00:00').toLocaleDateString('pl-PL', { month: 'short', year: 'numeric' });
const ofert = (n: number) => (n === 1 ? 'rejs' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'rejsy' : 'rejsów');

const LENGTH = [
  { v: '', label: 'Dowolnie' },
  { v: 's', label: 'do 8 dni' },
  { v: 'm', label: '9 do 12 dni' },
  { v: 'l', label: 'ponad 12 dni' },
];
const TRANSPORT = [
  { v: '', label: 'Dowolnie' },
  { v: 'plane', label: 'Z przelotem' },
  { v: 'own', label: 'Dojazd własny' },
];
const SORTS = [
  { v: 'price', label: 'Najtańsze' },
  { v: 'soon', label: 'Najbliższy termin' },
  { v: 'ppd', label: 'Najtańsze za dzień' },
  { v: 'long', label: 'Najdłuższe' },
];

async function load(terms: Record<string, unknown>): Promise<Offer[]> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(API, {
      method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terms: { regions: [], cities: [], countries: [CRUISE_COUNTRY_ID], limit: 100, ...terms } }),
    });
    const j = await r.json();
    return Array.isArray(j.data) ? j.data : [];
  } catch { return []; } finally { clearTimeout(timer); }
}

export default function CruiseBrowser({ initialArea = '' }: { initialArea?: string }) {
  const [pool, setPool] = useState<Row[] | null>(null);
  const [done, setDone] = useState(false);
  const [area, setArea] = useState(initialArea);
  const [month, setMonth] = useState('');
  const [length, setLength] = useState('');
  const [transport, setTransport] = useState('');
  const [line, setLine] = useState('');
  const [port, setPort] = useState('');
  const [service, setService] = useState('');
  const [budget, setBudget] = useState(0);
  const [sort, setSort] = useState('price');
  const [shown, setShown] = useState(12);

  useEffect(() => {
    let cancel = false;
    const seen = new Set<number>();
    const all: Row[] = [];
    const today = new Date().toISOString().slice(0, 10);
    const add = (l: Offer[]) => {
      if (cancel) return;
      for (const o of l) {
        if (seen.has(o.id) || !o.departureDate || o.departureDate < today) continue;
        seen.add(o.id);
        const { ship, route } = splitName(o.name);
        all.push({ ...o, ship, route, area: areaOf(o.name, (o.placeName || []).slice(1).join(' ')), line: lineOf(o.name), port: o.placeName?.[2] || '', p: num(o.price) });
      }
      setPool([...all]);
    };
    (async () => {
      add(await load({}));
      const more = [{ searchType: 'lastminute' }, { searchType: 'firstminute' }, { maxPrice: 4000 }, { maxPrice: 6000 }, { maxPrice: 9000 }, { service: [1] }, { service: [2] }, { service: [3] }];
      await Promise.all(more.map(async (t) => add(await load(t))));
      if (!cancel) setDone(true);
    })();
    return () => { cancel = true; };
  }, []);

  const pass = (o: Row, skip?: string) =>
    (skip === 'area' || !area || o.area === area) &&
    (skip === 'month' || !month || monthKey(o.departureDate) === month) &&
    (skip === 'length' || !length || (length === 's' ? o.duration <= 8 : length === 'm' ? o.duration >= 9 && o.duration <= 12 : o.duration > 12)) &&
    (skip === 'transport' || !transport || (transport === 'plane' ? o.transport?.value === 1 : o.transport?.value !== 1)) &&
    (skip === 'line' || !line || o.line === line) &&
    (skip === 'port' || !port || o.port === port) &&
    (skip === 'service' || !service || o.service?.label === service) &&
    (skip === 'budget' || !budget || o.p <= budget);

  const count = (skip: string, key: (o: Row) => string) => {
    const m = new Map<string, number>();
    (pool || []).filter((o) => pass(o, skip)).forEach((o) => { const k = key(o); if (k) m.set(k, (m.get(k) || 0) + 1); });
    return m;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deps = [pool, area, month, length, transport, line, port, service, budget];
  const areaCounts = useMemo(() => count('area', (o) => o.area), deps);
  const months = useMemo(() => [...count('month', (o) => monthKey(o.departureDate)).entries()].sort((a, b) => a[0].localeCompare(b[0])), deps);
  const lines = useMemo(() => [...count('line', (o) => o.line).entries()].sort((a, b) => b[1] - a[1]), deps);
  const ports = useMemo(() => [...count('port', (o) => o.port).entries()].sort((a, b) => b[1] - a[1]), deps);
  const services = useMemo(() => [...count('service', (o) => o.service?.label).entries()].sort((a, b) => b[1] - a[1]), deps);
  const maxPrice = useMemo(() => Math.ceil(Math.max(0, ...(pool || []).map((o) => o.p)) / 1000) * 1000, [pool]);
  const minPrice = useMemo(() => Math.min(...(pool || []).map((o) => o.p).filter(Boolean), Infinity), [pool]);

  const list = useMemo(() => {
    const l = (pool || []).filter((o) => pass(o));
    const by: Record<string, (a: Row, b: Row) => number> = {
      price: (a, b) => a.p - b.p,
      soon: (a, b) => a.departureDate.localeCompare(b.departureDate) || a.p - b.p,
      ppd: (a, b) => a.p / a.duration - b.p / b.duration,
      long: (a, b) => b.duration - a.duration || a.p - b.p,
    };
    return l.sort(by[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, sort]);

  useEffect(() => { setShown(12); }, [area, month, length, transport, line, port, service, budget, sort]);
  const active = !!(month || length || transport || line || port || service || budget || (area && area !== initialArea));
  const reset = () => { setArea(initialArea); setMonth(''); setLength(''); setTransport(''); setLine(''); setPort(''); setService(''); setBudget(0); };

  return (
    <div className="lm">
      <div className="lm-panel">
        <div className="lm-row">
          <span className="lm-label">Akwen</span>
          <div className="lm-pills" role="group" aria-label="Akwen">
            <button type="button" className={!area ? 'on' : ''} onClick={() => setArea('')}>Wszystkie</button>
            {CRUISE_AREAS.map((a) => (
              <button key={a.slug} type="button" className={area === a.slug ? 'on' : ''} aria-pressed={area === a.slug} onClick={() => setArea(a.slug)} disabled={!!pool && !areaCounts.get(a.slug) && area !== a.slug}>
                {a.short}{pool && <small> {areaCounts.get(a.slug) || 0}</small>}
              </button>
            ))}
          </div>
        </div>
        <div className="lm-row">
          <span className="lm-label">Miesiąc wypłynięcia</span>
          <div className="lm-pills" role="group" aria-label="Miesiąc">
            <button type="button" className={!month ? 'on' : ''} onClick={() => setMonth('')}>Dowolny</button>
            {months.map(([k, n]) => (
              <button key={k} type="button" className={month === k ? 'on' : ''} aria-pressed={month === k} onClick={() => setMonth(k)}>{monthLabel(k)}<small> {n}</small></button>
            ))}
          </div>
        </div>
        <div className="lm-row lm-two">
          <div>
            <span className="lm-label">Długość</span>
            <div className="lm-pills" role="group" aria-label="Długość rejsu">
              {LENGTH.map((s) => <button key={s.v} type="button" className={length === s.v ? 'on' : ''} onClick={() => setLength(s.v)}>{s.label}</button>)}
            </div>
          </div>
          <div>
            <span className="lm-label">Dojazd</span>
            <div className="lm-pills" role="group" aria-label="Dojazd">
              {TRANSPORT.map((s) => <button key={s.v} type="button" className={transport === s.v ? 'on' : ''} onClick={() => setTransport(s.v)}>{s.label}</button>)}
            </div>
          </div>
        </div>
        <div className="lm-row lm-grid">
          <label className="lm-budget">
            <span className="lm-label">Budżet na osobę: <b>{budget ? 'do ' + fmt(budget) + ' zł' : 'bez limitu'}</b></span>
            <input type="range" min={Math.max(1000, Math.floor((isFinite(minPrice) ? minPrice : 1000) / 1000) * 1000)} max={maxPrice || 30000} step={500}
              value={budget || maxPrice || 30000} onChange={(e) => { const v = Number(e.target.value); setBudget(v >= maxPrice ? 0 : v); }} />
          </label>
          <div className="lm-selects cr-selects">
            <label><span className="lm-label">Armator</span>
              <select value={line} onChange={(e) => setLine(e.target.value)}>
                <option value="">Wszyscy</option>
                {lines.map(([k, n]) => <option key={k} value={k}>{k} ({n})</option>)}
              </select>
            </label>
            <label><span className="lm-label">Port startowy</span>
              <select value={port} onChange={(e) => setPort(e.target.value)}>
                <option value="">Każdy</option>
                {ports.map(([k, n]) => <option key={k} value={k}>{k} ({n})</option>)}
              </select>
            </label>
            <label><span className="lm-label">Wyżywienie</span>
              <select value={service} onChange={(e) => setService(e.target.value)}>
                <option value="">Każde</option>
                {services.map(([k, n]) => <option key={k} value={k}>{k} ({n})</option>)}
              </select>
            </label>
            <label><span className="lm-label">Sortuj</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>

      {pool === null && <div className="ob-empty">Szukamy rejsów w biurach podróży...</div>}
      {pool !== null && (
        <div className="lm-bar">
          <span><b>{list.length}</b> {ofert(list.length)}{!done && <small className="lm-loading"> wczytujemy kolejne oferty...</small>}</span>
          {active && <button type="button" className="lm-reset" onClick={reset}>Wyczyść filtry</button>}
        </div>
      )}
      {pool !== null && done && list.length === 0 && (
        <div className="ob-empty">
          Brak rejsów dla wybranych filtrów. <button type="button" className="lm-reset" onClick={reset}>Wyczyść filtry</button> albo{' '}
          <a href="/go/rejsy/" target="_blank" rel="sponsored nofollow noopener">zobacz wszystkie rejsy na wakacje.pl</a>.
        </div>
      )}

      {list.length > 0 && (
        <>
          <ul className="ob-list">
            {list.slice(0, shown).map((o) => {
              const old = num(o.priceOld);
              return (
                <li key={o.id}>
                  <a className="ob-card" href={'/go/oferta/?c=rejsy&u=' + encodeURIComponent(o.url)} target="_blank" rel="sponsored nofollow noopener">
                    <div className="ob-img">
                      {o.photo && <img src={IMG + o.photo} alt={o.route} loading="lazy" />}
                      <span className="ob-promo cr-line">{o.line === 'Inni armatorzy' ? 'Rejs' : o.line}</span>
                    </div>
                    <div className="ob-body">
                      <span className="ob-place">{CRUISE_AREAS.find((a) => a.slug === o.area)?.short}{o.port ? ` · start: ${o.port}` : ''}</span>
                      <h3>{o.route}</h3>
                      {o.ship && <span className="cr-ship">Statek: {o.ship}</span>}
                      <ul className="ob-meta">
                        <li>{fmtDate(o.departureDate)} - {fmtDate(o.returnDate)} ({o.duration} dni)</li>
                        <li>{o.transport?.value === 1 ? `Przelot z: ${o.departure?.label}` : `${o.transport?.label || 'Dojazd własny'}`}</li>
                        <li>{o.service?.label}</li>
                        <li>{o.tourOperatorName}</li>
                      </ul>
                    </div>
                    <div className="ob-side">
                      {old > o.p && <s className="ob-old">{fmt(old)} zł</s>}
                      <span className="ob-price">{fmt(o.p)} zł</span>
                      <span className="ob-pp">za osobę</span>
                      <span className="cr-ppd">{fmt(Math.round(o.p / o.duration))} zł / dzień</span>
                      <span className="btn btn-sm">Zobacz rejs</span>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
          {shown < list.length && <button type="button" className="btn btn-ghost ob-more" onClick={() => setShown((s) => s + 12)}>Pokaż więcej rejsów</button>}
        </>
      )}
    </div>
  );
}
