import type { Country, Region } from '@/lib/types';
import { selfTravel } from '@/lib/travelpayouts';
import { hasFerry, ferryLink } from '@/lib/tradedoubler';
import FlightForm from './FlightForm';

// "Na własną rękę": lot (Aviasales), nocleg (Booking.com), auto (DiscoverCars). Linki partnerskie Travelpayouts.
export default function SelfTravel({ c, r }: { c: Country; r?: Region }) {
  const s = selfTravel(c, r);
  const place = r ? r.name : c.name;
  const loc = r ? r.loc : c.content?.loc || `w kraju ${c.name}`;
  return (
    <section className="ft" id="lot">
      <h2>Na własną rękę: lot, nocleg i auto {loc}</h2>
      <p>Wolisz zorganizować wyjazd sam? Porównaj loty z Polski, noclegi i wynajem samochodu.</p>
      {s.lotnisko && (
        <div className="ft-card ft-fly">
          <div className="ft-h"><span className="ft-i" aria-hidden="true">✈</span><div><h3>Loty do: {place}</h3><small>Porównanie cen wielu linii lotniczych i agencji</small></div></div>
          <FlightForm dest={s.lotnisko} destName={place} />
        </div>
      )}
      <div className="ft-row">
        <a className="ft-card ft-link" href={s.noclegi} target="_blank" rel="sponsored nofollow noopener">
          <span className="ft-i" aria-hidden="true">🛏</span>
          <div><h3>Noclegi: {place}</h3><small>Hotele, apartamenty i pensjonaty na Booking.com</small></div>
          <span className="ft-go">Szukaj &rarr;</span>
        </a>
        <a className="ft-card ft-link" href={s.auto} target="_blank" rel="sponsored nofollow noopener">
          <span className="ft-i" aria-hidden="true">🚗</span>
          <div><h3>Wynajem auta: {c.name}</h3><small>Porównanie ofert wielu wypożyczalni w DiscoverCars</small></div>
          <span className="ft-go">Porównaj &rarr;</span>
        </a>
        {hasFerry(c.slug) && (
          <a className="ft-card ft-link" href={ferryLink(c.slug, r?.slug)} target="_blank" rel="sponsored nofollow noopener">
            <span className="ft-i" aria-hidden="true">⛴</span>
            <div><h3>Promy: {place}</h3><small>Rozkłady i bilety na promy w Ferryhopper, po polsku</small></div>
            <span className="ft-go">Sprawdź &rarr;</span>
          </a>
        )}
      </div>
      <p className="ft-note">Linki partnerskie: rezerwując przez nie, nie płacisz więcej.</p>
    </section>
  );
}
