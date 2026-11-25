import type { Metadata } from 'next';
import { seo, ogImage } from '@/lib/seo';
import { MONTHS, warmIn } from '@/lib/data';
import Crumbs from '@/components/Crumbs';

export const metadata: Metadata = seo({
  title: 'Gdzie na wakacje? Kierunki na każdy miesiąc roku',
  description: 'Gdzie jest ciepło w styczniu, a gdzie pojechać w sierpniu? Kierunki wakacyjne na każdy miesiąc z temperaturą powietrza i wody.',
  path: '/gdzie-na-wakacje/',
});

export default function Months() {
  return (
    <div className="wrap">
      <Crumbs items={[{ name: 'Gdzie na wakacje' }]} />
      <section className="section-sm">
        <span className="eyebrow">Kalendarz wyjazdów</span>
        <h1 style={{ marginTop: 12 }}>Gdzie na wakacje? Wybierz miesiąc</h1>
        <p className="lead" style={{ marginTop: 16 }}>Zestawienia kierunków na podstawie średnich temperatur powietrza i wody oraz sezonu w danym kraju.</p>
      </section>
      <div className="grid g3 section-sm">
        {MONTHS.map((m, i) => {
          const w = warmIn(i).slice(0, 5);
          return (
            <a key={m.slug} className="tcard" href={`/gdzie-na-wakacje/${m.slug}/`}>
              <span className="meta">{w.length} kierunków</span>
              <h3>Gdzie na wakacje {m.loc}?</h3>
              <p>{w.map((x) => x.country.name).join(', ')}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
