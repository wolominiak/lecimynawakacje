import type { Metadata } from 'next';
import { CONTINENTS, getByContinent, getCountries } from '@/lib/data';
import Crumbs from '@/components/Crumbs';

export const metadata: Metadata = {
  title: 'Kierunki wakacyjne A-Z - wszystkie kraje świata',
  description: 'Lista wszystkich krajów świata podzielona na kontynenty. Wybierz kierunek i sprawdź, kiedy jechać, co zobaczyć i jakie są oferty wakacji.',
  alternates: { canonical: '/wakacje/' },
};

export default function All() {
  const n = getCountries().length;
  return (
    <div className="wrap">
      <Crumbs items={[{ name: 'Kierunki' }]} />
      <section className="section-sm">
        <span className="eyebrow">{n} krajów i terytoriów</span>
        <h1 style={{ marginTop: 12 }}>Kierunki wakacyjne od A do Z</h1>
        <p className="lead" style={{ marginTop: 16 }}>Wszystkie kraje świata w jednym miejscu. Pogrubione kierunki mają pełny przewodnik z regionami, pogodą i atrakcjami.</p>
      </section>
      {CONTINENTS.map((ct) => (
        <section key={ct.slug} className="section-sm" style={{ borderTop: '1px solid var(--line)' }}>
          <div className="sec-head">
            <h2>{ct.name}</h2>
            <a className="link-arrow" href={`/kontynenty/${ct.slug}/`}>Wakacje {ct.loc} &rarr;</a>
          </div>
          <div className="clist">
            {getByContinent(ct.slug).map((c) => (
              <a key={c.slug} href={`/wakacje/${c.slug}/`} className={c.content ? 'has' : ''}><span className="pip" />{c.name}</a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
