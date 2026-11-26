'use client';
import { useEffect, useMemo, useState } from 'react';
import { promoOffers, fmtPrice, offerHref } from '@/lib/promo';

// Wszystkie terminy jednego hotelu w jednej liście: wakacje.pl (na żywo, wiele biur) + Exim Tours (feed).
export type EximTerm = { id: string; dd: string; rd: string; nn: number; b: string; d: string; pp: number; u: string };
type Row = { key: string; date: string; nights: number; board: string; from: string; pp: number; operator: string; href: string };

const MON = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
const DOW = ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb'];
const day = (iso: string) => { const d = new Date(iso + 'T12:00:00'); return `${DOW[d.getDay()]} ${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`; };
const nocy = (n: number) => `${n} ${n === 1 ? 'noc' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'noce' : 'nocy'}`;
const between = (a: string, b: string) => Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / 86400000));
const airport = (s: string) => s.split(/\s+-\s+/)[0];

export default function HotelTerms({ id, name, exim = [] }: { id?: number; name: string; exim?: EximTerm[] }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [from, setFrom] = useState('');
  const [month, setMonth] = useState('');
  const [op, setOp] = useState('');
  const [sort, setSort] = useState<'date' | 'price'>('price');
  const [more, setMore] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const ex: Row[] = exim.filter((o) => o.dd >= today).map((o) => ({
      key: 'x' + o.id, date: o.dd, nights: o.nn, board: o.b, from: o.d, pp: o.pp, operator: 'Exim Tours', href: '/go/exim/?u=' + encodeURIComponent(o.u),
    }));
    if (typeof id !== 'number') { setRows(ex); return; }
    promoOffers({ hotels: [id] }).then((l) => setRows([
      ...l.map((o) => ({
        key: 't' + o.id, date: o.date, nights: o.ret ? between(o.date, o.ret) : Math.max(0, o.days - 1), board: o.board, from: o.from,
        pp: o.price, operator: o.operator || 'wakacje.pl', href: offerHref(o, 'hotel'),
      })),
      ...ex,
    ]));
  }, [id, exim]);

  const froms = useMemo(() => [...new Set((rows || []).map((o) => airport(o.from)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pl')), [rows]);
  const months = useMemo(() => [...new Set((rows || []).map((o) => o.date.slice(0, 7)))].sort(), [rows]);
  const ops = useMemo(() => [...new Set((rows || []).map((o) => o.operator))].sort((a, b) => a.localeCompare(b, 'pl')), [rows]);
  const shown = useMemo(() => (rows || [])
    .filter((o) => (!from || airport(o.from) === from) && (!month || o.date.startsWith(month)) && (!op || o.operator === op))
    .sort((a, b) => (sort === 'price' ? a.pp - b.pp : a.date.localeCompare(b.date) || a.pp - b.pp)), [rows, from, month, op, sort]);
  const best = rows?.length ? Math.min(...rows.map((o) => o.pp)) : 0;

  if (rows && !rows.length) {
    return <div className="notice">Teraz biura podróży nie mają wolnych terminów w hotelu {name}. Zobacz podobne hotele w okolicy poniżej.</div>;
  }
  return (
    <div className="ht">
      {rows && (
        <div className="ht-bar">
          <select value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Wylot z">
            <option value="">Wylot: wszystkie lotniska</option>
            {froms.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Miesiąc">
            <option value="">Wszystkie miesiące</option>
            {months.map((m) => <option key={m} value={m}>{MON[Number(m.slice(5, 7)) - 1]} {m.slice(0, 4)}</option>)}
          </select>
          {ops.length > 1 && (
            <select value={op} onChange={(e) => setOp(e.target.value)} aria-label="Biuro podróży">
              <option value="">Wszystkie biura</option>
              {ops.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
          <select value={sort} onChange={(e) => setSort(e.target.value as 'date' | 'price')} aria-label="Sortuj">
            <option value="price">Najtańsze</option>
            <option value="date">Najbliższe terminy</option>
          </select>
        </div>
      )}
      {!rows ? (
        <ul className="ht-list promo-skel"><li /><li /><li /><li /></ul>
      ) : (
        <ul className="ht-list">
          {shown.slice(0, more ? 80 : 10).map((o) => (
            <li key={o.key}>
              <div className="ht-when"><b>{day(o.date)}</b><small>{nocy(o.nights)}</small></div>
              <div className="ht-what"><span>{o.board}</span><small>Wylot: {o.from}</small></div>
              <div className="ht-op">{o.operator}</div>
              <div className="ht-price">
                {o.pp === best && <span className="ht-best">najtaniej</span>}
                <b>{fmtPrice(o.pp)}</b><small>za osobę</small>
              </div>
              <a className="btn btn-sm" href={o.href} target="_blank" rel="sponsored nofollow noopener">Zarezerwuj</a>
            </li>
          ))}
        </ul>
      )}
      {rows && shown.length > 10 && !more && <button className="btn btn-ghost btn-sm" onClick={() => setMore(true)}>Pokaż wszystkie terminy ({shown.length})</button>}
    </div>
  );
}
