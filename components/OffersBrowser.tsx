'use client';
import { useHotelPages } from './useHotelPages';
import { useEffect, useMemo, useState } from 'react';

// Lista ofert wakacje.pl (TravelLead) z filtrami, na stronie kraju.
// Dane: to samo API, z którego korzysta widget mini-listing. API filtruje po kraju, wyżywieniu i cenie;
// region, lotnisko i sortowanie liczymy tu, na pobranej puli (maks. 100 ofert).
// Terminu API nie obsługuje, więc wyszukiwanie z datami przekazujemy do wakacje.pl.

const API = 'https://widget.wakacje.pl/v2/api/widgets/offers';
const IMG = 'https://i.wakacje.pl';

type Offer = {
  hotelId?: number;
  id: number;
  name: string;
  price: string;
  priceOld: string;
  duration: number;
  departureDate: string;
  returnDate: string;
  category: number;
  departure: { label: string; urlName: string; value: number };
  service: { label: string; urlName: string; value: number };
  placeName: string[];
  photo: string;
  tourOperatorName: string;
  ratingValue: number;
  ratingRecommends: number;
  promos: string[];
  url: string;
};

const SERVICES = [
  { v: '', label: 'Dowolne wyżywienie' },
  { v: '1', label: 'All inclusive' },
  { v: '2', label: 'Śniadania i obiadokolacje' },
  { v: '3', label: 'Śniadania' },
  { v: '4', label: 'Bez wyżywienia' },
];
const PRICES = ['', '2000', '3000', '4000', '5000', '7000', '10000'];
const SORTS = [
  { v: 'price', label: 'Najtańsze' },
  { v: 'rating', label: 'Najlepiej oceniane' },
  { v: 'stars', label: 'Najwyższy standard' },
  { v: 'date', label: 'Najbliższy wylot' },
];
const PROMO: Record<string, string> = { firstminute: 'First minute', lastminute: 'Last minute', top10: 'Top 10', top10kids: 'Dla rodzin', new: 'Nowość' };

const num = (p: string) => Number(String(p).replace(/\s/g, '').replace(',', '.')) || 0;
const fmtDate = (d: string) => d.slice(8, 10) + '.' + d.slice(5, 7);
const fmtPrice = (n: number) => n.toLocaleString('pl-PL');

export default function OffersBrowser({ countryId, wakacjePath, loc }: { countryId: number; wakacjePath: string; loc: string }) {
  const hp = useHotelPages();
  const [service, setService] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [region, setRegion] = useState('');
  const [airport, setAirport] = useState('');
  const [sort, setSort] = useState('price');
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [error, setError] = useState(false);
  const [shown, setShown] = useState(12);

  // termin (przekazywany do wakacje.pl)
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [nights, setNights] = useState('');

  useEffect(() => {
    let cancel = false;
    setOffers(null);
    setError(false);
    const terms: Record<string, unknown> = { limit: 100, countries: [countryId], regions: [], cities: [] };
    if (service) terms.service = [Number(service)];
    if (maxPrice) terms.maxPrice = Number(maxPrice);
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ terms }) })
      .then((r) => r.json())
      .then((j) => { if (!cancel) setOffers(Array.isArray(j.data) ? j.data : []); })
      .catch(() => { if (!cancel) { setError(true); setOffers([]); } });
    return () => { cancel = true; };
  }, [countryId, service, maxPrice]);

  const regions = useMemo(() => {
    const m = new Map<string, number>();
    (offers || []).forEach((o) => { const r = o.placeName?.[1]; if (r) m.set(r, (m.get(r) || 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [offers]);
  const airports = useMemo(() => {
    const m = new Map<string, { label: string; n: number }>();
    (offers || []).forEach((o) => { const a = o.departure; if (a?.urlName) m.set(a.urlName, { label: a.label, n: (m.get(a.urlName)?.n || 0) + 1 }); });
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n);
  }, [offers]);

  const list = useMemo(() => {
    let l = (offers || []).filter((o) => (!region || o.placeName?.[1] === region) && (!airport || o.departure?.urlName === airport));
    const by: Record<string, (a: Offer, b: Offer) => number> = {
      price: (a, b) => num(a.price) - num(b.price),
      rating: (a, b) => (b.ratingValue || 0) - (a.ratingValue || 0),
      stars: (a, b) => (b.category || 0) - (a.category || 0) || num(a.price) - num(b.price),
      date: (a, b) => a.departureDate.localeCompare(b.departureDate),
    };
    return [...l].sort(by[sort]);
  }, [offers, region, airport, sort]);

  useEffect(() => { setShown(12); }, [service, maxPrice, region, airport, sort]);

  function searchWithDates(e: React.FormEvent) {
    e.preventDefault();
    const f: string[] = [];
    if (from) f.push('od-' + from);
    if (to) f.push('do-' + to);
    if (nights) f.push(nights + '-dni');
    f.push('samolotem');
    if (service && offers) { const o = offers.find((x) => String(x.service?.value) === service); if (o?.service?.urlName) f.push(o.service.urlName); }
    if (airport) f.push(airport);
    const q = new URLSearchParams({ p: wakacjePath, f: f.join(',') });
    window.open('/go/szukaj/?' + q.toString(), '_blank', 'noopener');
  }

  return (
    <div className="ob">
      <form className="ob-dates" onSubmit={searchWithDates}>
        <div className="ob-dates-h">
          <b>Masz konkretny termin?</b>
          <span>Wybierz daty, a pokażemy wszystkie oferty {loc} w tym terminie na wakacje.pl.</span>
        </div>
        <label>Wylot od<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>Powrót do<input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
        <label>Długość
          <select value={nights} onChange={(e) => setNights(e.target.value)}>
            <option value="">Dowolna</option>
            <option value="7">7 dni</option>
            <option value="10">10 dni</option>
            <option value="14">14 dni</option>
          </select>
        </label>
        <button className="btn" type="submit">Szukaj z terminem &rarr;</button>
      </form>

      <div className="ob-head">
        <h2>Najlepsze oferty {loc}</h2>
        <p className="muted">Promocje biur podróży, ceny za osobę za cały pobyt z przelotem.</p>
      </div>

      <div className="ob-filters">
        <label>Region
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">Wszystkie regiony</option>
            {regions.map(([r, n]) => <option key={r} value={r}>{r} ({n})</option>)}
          </select>
        </label>
        <label>Wyżywienie
          <select value={service} onChange={(e) => setService(e.target.value)}>
            {SERVICES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
        </label>
        <label>Cena do
          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
            {PRICES.map((p) => <option key={p} value={p}>{p ? fmtPrice(Number(p)) + ' zł' : 'Dowolna'}</option>)}
          </select>
        </label>
        <label>Wylot z
          <select value={airport} onChange={(e) => setAirport(e.target.value)}>
            <option value="">Każde lotnisko</option>
            {airports.map(([k, a]) => <option key={k} value={k}>{a.label} ({a.n})</option>)}
          </select>
        </label>
        <label>Sortuj
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {offers === null && <div className="ob-empty">Wczytujemy oferty...</div>}
      {offers !== null && list.length === 0 && (
        <div className="ob-empty">
          {error ? 'Nie udało się wczytać ofert.' : 'Brak ofert dla wybranych filtrów.'}{' '}
          <a href={`/go/wakacje/${wakacjePath}/`} target="_blank" rel="sponsored nofollow noopener">Zobacz wszystkie oferty na wakacje.pl</a>
        </div>
      )}

      {offers !== null && list.length > 0 && (
        <>
          <div className="ob-count">{list.length} {list.length === 1 ? 'oferta' : list.length % 10 >= 2 && list.length % 10 <= 4 && (list.length % 100 < 10 || list.length % 100 >= 20) ? 'oferty' : 'ofert'}</div>
          <ul className="ob-list">
            {list.slice(0, shown).map((o) => {
              const price = num(o.price);
              const old = num(o.priceOld);
              return (
                <li key={o.id}>
                  <a className="ob-card" {...(hp[o.hotelId ?? 0] ? { href: `/hotel/${hp[o.hotelId ?? 0]}/` } : { href: '/go/oferta/?u=' + encodeURIComponent(o.url), target: '_blank', rel: 'sponsored nofollow noopener' })}>
                    <div className="ob-img">
                      {o.photo && <img src={IMG + o.photo} alt={o.name} loading="lazy" />}
                      {o.promos?.[0] && PROMO[o.promos[0]] && <span className="ob-promo">{PROMO[o.promos[0]]}</span>}
                    </div>
                    <div className="ob-body">
                      <span className="ob-place">{o.placeName.slice(1).join(' / ')}</span>
                      <h3>{o.name}</h3>
                      <span className="ob-stars" aria-label={`Standard ${o.category} gwiazdki`}>{'★'.repeat(Math.round(o.category || 0))}</span>
                      <ul className="ob-meta">
                        <li>{fmtDate(o.departureDate)} - {fmtDate(o.returnDate)}.{o.returnDate.slice(0, 4)} ({o.duration} dni)</li>
                        <li>Wylot: {o.departure?.label}</li>
                        <li>{o.service?.label}</li>
                        <li>{o.tourOperatorName}</li>
                      </ul>
                    </div>
                    <div className="ob-side">
                      {o.ratingValue > 0 && <span className="ob-rating"><b>{o.ratingValue.toFixed(1)}</b> {o.ratingRecommends} opinii</span>}
                      {old > price && <s className="ob-old">{fmtPrice(old)} zł</s>}
                      <span className="ob-price">{fmtPrice(price)} zł</span>
                      <span className="ob-pp">za osobę</span>
                      <span className="btn btn-sm">Zobacz ofertę</span>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
          {shown < list.length && (
            <button type="button" className="btn btn-ghost ob-more" onClick={() => setShown((s) => s + 12)}>Pokaż więcej ofert</button>
          )}
        </>
      )}
    </div>
  );
}
