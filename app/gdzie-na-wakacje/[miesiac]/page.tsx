import type { Metadata } from 'next';
import { seo, ogImage } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { MONTHS, warmIn } from '@/lib/data';
import Crumbs from '@/components/Crumbs';
import { wakacjeUrl } from '@/lib/affiliate';

export const dynamicParams = false;
export function generateStaticParams() { return MONTHS.map((m) => ({ miesiac: m.slug })); }
type P = { params: Promise<{ miesiac: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { miesiac } = await params;
  const i = MONTHS.findIndex((m) => m.slug === miesiac);
  if (i < 0) return {};
  const top = warmIn(i).slice(0, 4).map((x) => x.country.name).join(', ');
  return seo({
    title: `Gdzie na wakacje ${MONTHS[i].loc}? Ciepłe kierunki i temperatury`,
    description: `Gdzie jest ciepło ${MONTHS[i].loc}? ${top} i inne kierunki z temperaturą powietrza i wody. Sprawdź, gdzie pojechać.`,
    path: `/gdzie-na-wakacje/${miesiac}/`,
  });
}

export default async function MonthPage({ params }: P) {
  const { miesiac } = await params;
  const i = MONTHS.findIndex((m) => m.slug === miesiac);
  if (i < 0) notFound();
  const m = MONTHS[i];
  const list = warmIn(i);
  const best = list.filter((x) => x.best);
  const ok = list.filter((x) => !x.best);
  return (
    <div className="wrap">
      <Crumbs items={[{ name: 'Gdzie na wakacje', url: '/gdzie-na-wakacje/' }, { name: m.name }]} />
      <section className="section-sm">
        <span className="eyebrow">{list.length} kierunków</span>
        <h1 style={{ marginTop: 12 }}>Gdzie na wakacje {m.loc}?</h1>
        <p className="lead" style={{ marginTop: 16 }}>
          {best.length ? `${m.loc[0].toUpperCase() + m.loc.slice(1)} najlepiej sprawdzają się: ${best.slice(0, 5).map((x) => x.country.name).join(', ')}.` : ''} Poniżej pełne zestawienie z temperaturami powietrza i wody.
        </p>
      </section>
      <div className="layout section-sm">
        <div className="prose">
          {best.length > 0 && <h2>Idealny termin {m.loc}</h2>}
          <div className="attr">
            {best.map((x, k) => <Row key={x.country.slug} x={x} n={k + 1} m={i} />)}
          </div>
          {ok.length > 0 && <h2>Też będzie dobrze</h2>}
          <div className="attr">
            {ok.map((x, k) => <Row key={x.country.slug} x={x} n={best.length + k + 1} m={i} />)}
          </div>
          <h2>Inne miesiące</h2>
          <div className="chips">{MONTHS.filter((x) => x.slug !== m.slug).map((x) => <a key={x.slug} className="chip chip-light" href={`/gdzie-na-wakacje/${x.slug}/`}>{x.name}</a>)}</div>
        </div>
        <aside className="aside">
          <div className="box box-cta">
            <h3>Wakacje {m.loc}</h3>
            <p>Porównaj oferty biur podróży na wybrany termin.</p>
            <a className="btn" href={wakacjeUrl()} target="_blank" rel="sponsored nofollow noopener">Szukaj ofert &rarr;</a>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ x, n, m }: { x: ReturnType<typeof warmIn>[number]; n: number; m: number }) {
  const c = x.country;
  return (
    <div className="attr-item">
      <div className="num">{n}</div>
      <div>
        <h3><a href={`/wakacje/${c.slug}/`} style={{ textDecoration: 'none', color: 'inherit' }}>{c.name}</a></h3>
        <p><b>{x.air}°C</b> w dzień{x.sea ? <>, woda <b>{x.sea}°C</b></> : null}. {c.content!.teaser}</p>
        <a className="gyg" href={`/wakacje/${c.slug}/kiedy-jechac/`}>Pogoda {c.content!.loc} &rarr;</a>
      </div>
    </div>
  );
}
