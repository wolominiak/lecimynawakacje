'use client';
import { useEffect, useMemo, useState } from 'react';
import { promoOffers, fmtPrice, offerHref, type PromoOffer } from '@/lib/promo';

// Wszystkie dostępne terminy jednego hotelu, na żywo z API wakacje.pl
const MON = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
const DOW = ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb'];
const day = (iso: string) => { const d = new Date(iso + 'T12:00:00'); return `${DOW[d.getDay()]} ${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`; };

export default function HotelTerms({ id, name }: { id: number; name: string }) {
  const [list, setList] = useState<PromoOffer[] | null>(null);
  const [from, setFrom] = useState('');
  const [month, setMonth] = useState('');
  const [sort, setSort] = useState<'date' | 'price'>('price');
  const [more, setMore] = useState(false);
  useEffect(() => { promoOffers({ hotels: [id] }).then(setList); }, [id]);

  const froms = useMemo(() => [...new Set((list || []).map((o) => o.from).filter(Boolean))].sort(), [list]);
  const months = useMemo(() => [...new Set((list || []).map((o) => o.date.slice(0, 7)))].sort(), [list]);
  const shown = useMemo(() => (list || [])
    .filter((o) => (!from || o.from === from) && (!month || o.date.startsWith(month)))
    .sort((a, b) => (sort === 'price' ? a.price - b.price : a.date.localeCompare(b.date) || a.price - b.price)), [list, from, month, sort]);
  const best = list?.length ? Math.min(...list.map((o) => o.price)) : 0;

  if (list && !list.length) {
    return (
      <div className="notice">Teraz biura podróży nie mają wolnych terminów w hotelu {name}. Zobacz podobne hotele w okolicy poniżej albo sprawdź oferty w całym regionie.</div>
    );
  }
  return (
    <div className="ht">
      {list && (
        <div className="ht-bar">
          <select value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Wylot z">
            <option value="">Wylot: wszystkie lotniska</option>
            {froms.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Miesiąc">
            <option value="">Wszystkie miesiące</option>
            {months.map((m) => <option key={m} value={m}>{MON[Number(m.slice(5, 7)) - 1]} {m.slice(0, 4)}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as 'date' | 'price')} aria-label="Sortuj">
            <option value="price">Najtańsze</option>
            <option value="date">Najbliższe terminy</option>
          </select>
        </div>
      )}
      {!list ? (
        <ul className="ht-list promo-skel"><li /><li /><li /><li /></ul>
      ) : (
        <ul className="ht-list">
          {shown.slice(0, more ? 60 : 10).map((o) => (
            <li key={o.id}>
              <div className="ht-when"><b>{day(o.date)}</b><small>{o.days} dni, {o.days - 1} nocy</small></div>
              <div className="ht-what"><span>{o.board}</span><small>Wylot: {o.from}</small></div>
              <div className="ht-price">
                {o.price === best && <span className="ht-best">najtaniej</span>}
                <b>{fmtPrice(o.price)}</b><small>za osobę</small>
              </div>
              <a className="btn btn-sm" href={offerHref(o, 'hotel')} target="_blank" rel="sponsored nofollow noopener">Zarezerwuj</a>
            </li>
          ))}
        </ul>
      )}
      {list && shown.length > 10 && !more && <button className="btn btn-ghost btn-sm" onClick={() => setMore(true)}>Pokaż wszystkie terminy ({shown.length})</button>}
    </div>
  );
}
