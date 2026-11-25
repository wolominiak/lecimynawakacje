import type { Metadata } from 'next';
import { seo, ogImage } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { CONTINENTS, getByContinent } from '@/lib/data';
import type { ContinentSlug } from '@/lib/types';
import Crumbs from '@/components/Crumbs';
import { DestCard } from '@/components/Cards';

export const dynamicParams = false;
export function generateStaticParams() { return CONTINENTS.map((c) => ({ slug: c.slug })); }
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const ct = CONTINENTS.find((c) => c.slug === slug);
  if (!ct) return {};
  return seo({
    title: `Wakacje ${ct.loc} - kraje, kierunki i regiony`,
    description: `${ct.teaser} Sprawdź, kiedy jechać, co zobaczyć i jakie są oferty wakacji ${ct.loc}.`,
    path: `/kontynenty/${slug}/`,
  });
}

export default async function ContinentPage({ params }: P) {
  const { slug } = await params;
  const ct = CONTINENTS.find((c) => c.slug === slug);
  if (!ct) notFound();
  const list = getByContinent(ct.slug as ContinentSlug);
  const guides = list.filter((c) => c.content).sort((a, b) => (b.content!.popularity || 0) - (a.content!.popularity || 0));
  const rest = list.filter((c) => !c.content);
  return (
    <div className="wrap">
      <Crumbs items={[{ name: 'Kierunki', url: '/wakacje/' }, { name: ct.name }]} />
      <section className="section-sm">
        <span className="eyebrow">{list.length} krajów</span>
        <h1 style={{ marginTop: 12 }}>Wakacje {ct.loc}</h1>
        <p className="lead" style={{ marginTop: 16 }}>{ct.teaser}</p>
      </section>
      {guides.length > 0 && (
        <section className="section-sm">
          <h2 style={{ marginBottom: 24 }}>Przewodniki</h2>
          <div className="grid g4">{guides.map((c) => <DestCard key={c.slug} c={c} />)}</div>
        </section>
      )}
      {rest.length > 0 && (
        <section className="section-sm">
          <h2 style={{ marginBottom: 24 }}>Pozostałe kraje</h2>
          <div className="clist">{rest.map((c) => <a key={c.slug} href={`/wakacje/${c.slug}/`}><span className="pip" />{c.name}</a>)}</div>
        </section>
      )}
    </div>
  );
}
