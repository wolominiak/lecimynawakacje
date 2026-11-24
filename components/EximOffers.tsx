'use client';
import { useEffect, useMemo, useState } from 'react';

// Oferty Exim Tours z feedu TradeDoublera (public/exim/<kraj>.json, aktualizowane codziennie).
// Każda oferta ma konkretny termin, więc filtr dat działa tutaj, na stronie.

type O = { id: string; n: string; c: string; r: string; s: number; d: string; dd: string; rd: string; nn: number; b: string; bc: string; a: number; k: number; p: number; pp: number; lm: boolean; img: string; u: string };

const LEN = [
  { v: '', label: 'Dowolna' },
  { v: '1-4', label: 'do 4 nocy' },
  { v: '5-7', label: '5-7 nocy' },
  { v: '8-10', label: '8-10 nocy' },
  { v: '11-99', label: '11+ nocy' },
];
const SORTS = [
  { v: 'price', label: 'Najtańsze' },
  { v: 'date', label: 'Najbliższy termin' },
  { v: 'stars', label: 'Najwyższy standard' },
];
const fmt = (n: number) => n.toLocaleString('pl-PL');
const dmy = (d: string) => d.slice(8, 10) + '.' + d.slice(5, 7) + '.' + d.slice(0, 4);
const ofert = (n: number) => (n === 1 ? 'oferta' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'oferty' : 'ofert');

export default function EximOffers({ slug, loc }: { slug: string; loc: string }) {
  const [all, setAll] = useState<O[] | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [len, setLen] = useState('');
  const [board, setBoard] = useState('');
  const [dep, setDep] = useState('');
  const [region, setRegion] = useState('');
  const [sort, setSort] = useState('price');
  const [shown, setShown] = useState(10);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/exim/${slug}.json`).then((r) => (r.ok ? r.json() : [])).then((l: O[]) => setAll(l.filter((o) => o.dd >= today))).catch(() => setAll([]));
  }, [slug]);

  const uniq = (k: 'b' | 'd' | 'r') => [...new Set((all || []).map((o) => o[k]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pl'));
  const boards = useMemo(() => uniq('b'), [all]); // eslint-disable-line react-hooks/exhaustive-deps
  const deps = useMemo(() => uniq('d'), [all]); // eslint-disable-line react-hooks/exhaustive-deps
  const regions = useMemo(() => uniq('r'), [all]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = useMemo(() => {
    const [lo, hi] = len ? len.split('-').map(Number) : [0, 999];
    const l = (all || []).filter((o) =>
      (!from || o.dd >= from) && (!to || o.dd <= to) && o.nn >= lo && o.nn <= hi &&
      (!board || o.b === board) && (!dep || o.d === dep) && (!region || o.r === region));
    const by: Record<string, (a: O, b: O) => number> = {
      price: (a, b) => a.p / a.a - b.p / b.a,
      date: (a, b) => a.dd.localeCompare(b.dd) || a.p - b.p,
      stars: (a, b) => b.s - a.s || a.p - b.p,
    };
    return l.sort(by[sort]);
  }, [all, from, to, len, board, dep, region, sort]);

  useEffect(() => { setShown(10); }, [from, to, len, board, dep, region, sort]);

  if (all !== null && all.length === 0) return null;

  return (
    <section className="ex">
      <div className="ob-head">
        <h2>Wakacje {loc} w wybranym terminie</h2>
        <p className="muted">Oferty Exim Tours z konkretną datą wylotu. Wybierz termin i długość pobytu.</p>
      </div>
      <div className="ob-filters ex-filters">
        <label>Wylot od<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>Wylot do<input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
        <label>Długość
          <select value={len} onChange={(e) => setLen(e.target.value)}>{LEN.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}</select>
        </label>
        <label>Wyżywienie
          <select value={board} onChange={(e) => setBoard(e.target.value)}>
            <option value="">Dowolne</option>{boards.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
        <label>Wylot z
          <select value={dep} onChange={(e) => setDep(e.target.value)}>
            <option value="">Każde lotnisko</option>{deps.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
        {regions.length > 1 && (
          <label>Region
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="">Wszystkie</option>{regions.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
        )}
        <label>Sortuj
          <select value={sort} onChange={(e) => setSort(e.target.value)}>{SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}</select>
        </label>
      </div>

      {all === null && <div className="ob-empty">Wczytujemy oferty...</div>}
      {all !== null && (
        <div className="ob-count">{list.length} {ofert(list.length)}{(from || to) ? ' w wybranym terminie' : ''}</div>
      )}
      {all !== null && list.length === 0 && <div className="ob-empty">Brak ofert w tym terminie. Zmień daty albo zobacz promocje poniżej.</div>}
      {list.length > 0 && (
        <ul className="ob-list">
          {list.slice(0, shown).map((o) => {
            const people = o.a + o.k;
            return (
              <li key={o.id}>
                <a className="ob-card" href={'/go/exim/?u=' + encodeURIComponent(o.u)} target="_blank" rel="sponsored nofollow noopener">
                  <div className="ob-img">
                    {o.img && <img src={o.img} alt={o.n} loading="lazy" />}
                    {o.lm && <span className="ob-promo hot">Last minute</span>}
                  </div>
                  <div className="ob-body">
                    <span className="ob-place">{[o.r, o.c].filter(Boolean).join(' / ')}</span>
                    <h3>{o.n}</h3>
                    <span className="ob-stars" aria-label={`Standard ${o.s} gwiazdki`}>{'★'.repeat(o.s)}</span>
                    <ul className="ob-meta">
                      <li>{dmy(o.dd)} - {dmy(o.rd)} ({o.nn} {o.nn === 1 ? 'noc' : o.nn < 5 ? 'noce' : 'nocy'})</li>
                      <li>Wylot: {o.d}</li>
                      <li>{o.b}</li>
                      <li>Exim Tours</li>
                    </ul>
                  </div>
                  <div className="ob-side">
                    {o.pp > o.p && <s className="ob-old">{fmt(o.pp)} zł</s>}
                    <span className="ob-price">{fmt(Math.round(o.p / people))} zł</span>
                    <span className="ob-pp">za osobę, {fmt(o.p)} zł za {people} os.</span>
                    <span className="btn btn-sm">Zobacz ofertę</span>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {shown < list.length && <button type="button" className="btn btn-ghost ob-more" onClick={() => setShown((s) => s + 10)}>Pokaż więcej</button>}
    </section>
  );
}
