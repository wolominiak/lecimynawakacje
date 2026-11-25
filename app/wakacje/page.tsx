import type { Metadata } from 'next';
import { seo, ogImage } from '@/lib/seo';
import { CONTINENTS, getByContinent, getCountries, availableSubpages } from '@/lib/data';
import Crumbs from '@/components/Crumbs';

export const metadata: Metadata = seo({
  title: 'Kierunki wakacyjne A-Z - wszystkie kraje świata',
  description: 'Lista wszystkich krajów świata podzielona na kontynenty. Wybierz kierunek i sprawdź, kiedy jechać, co zobaczyć i jakie są oferty wakacji.',
  path: '/wakacje/',
});

export default function All() {
  const all = getCountries();
  const n = all.length;
  const withOffers = all.filter((c) => availableSubpages(c).includes('oferty')).length;
  return (
    <div className="wrap">
      <Crumbs items={[{ name: 'Kierunki' }]} />
      <section className="section-sm">
        <span className="eyebrow">{n} krajów i terytoriów</span>
        <h1 style={{ marginTop: 12 }}>Kierunki wakacyjne od A do Z</h1>
        <p className="lead" style={{ marginTop: 16 }}>Wszystkie kraje świata w jednym miejscu, każdy z przewodnikiem: kiedy jechać, regiony, atrakcje, noclegi i wynajem auta. <b>Pogrubione</b> kierunki ({withOffers}) mają też aktualne oferty biur podróży z cenami i terminami.</p>
      </section>
      {CONTINENTS.map((ct) => (
        <section key={ct.slug} className="section-sm" style={{ borderTop: '1px solid var(--line)' }}>
          <div className="sec-head">
            <h2>{ct.name}</h2>
            <a className="link-arrow" href={`/kontynenty/${ct.slug}/`}>Wakacje {ct.loc} &rarr;</a>
          </div>
          <div className="clist">
            {getByContinent(ct.slug).map((c) => (
              <a key={c.slug} href={`/wakacje/${c.slug}/`} className={availableSubpages(c).includes('oferty') ? 'has' : ''} title={availableSubpages(c).includes('oferty') ? 'Przewodnik i oferty biur podróży' : 'Przewodnik'}><span className="pip" />{c.name}</a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
