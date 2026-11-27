import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCountry, continentOf } from '@/lib/data';
import { allAttractionPages, getAttraction, attractionsOf, attractionSlug } from '@/lib/attractions';
import { seo, ogImage, pick } from '@/lib/seo';
import { SITE, gygSearchUrl } from '@/lib/affiliate';
import { stayLink, carLink } from '@/lib/travelpayouts';
import CountryHero from '@/components/CountryHero';
import Tabs from '@/components/Tabs';
import Aside from '@/components/Aside';
import Faq from '@/components/Faq';
import { GygWidget, GygAvailability } from '@/components/Gyg';
import SeePlaces from '@/components/SeePlaces';

// Strona pojedynczej atrakcji: /wakacje/<kraj>/atrakcje/<atrakcja>/
type P = { params: Promise<{ kraj: string; sub: string; attr: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return allAttractionPages().map((a) => ({ kraj: a.kraj, sub: 'atrakcje', attr: a.slug }));
}

function resolve(kraj: string, sub: string, attr: string) {
  if (sub !== 'atrakcje') return null;
  const c = getCountry(kraj);
  const a = c && getAttraction(kraj, attr);
  return c?.content && a ? { c, a } : null;
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { kraj, sub, attr } = await params;
  const r = resolve(kraj, sub, attr);
  if (!r) return {};
  const { c, a } = r;
  return seo({
    title: pick(`${a.name} - zwiedzanie, bilety, wycieczki (${c.name})`, `${a.name} (${c.name}) - zwiedzanie i bilety`, `${a.name} - zwiedzanie i bilety`, `${a.name}, ${c.name}`),
    description: a.lead,
    path: `/wakacje/${c.slug}/atrakcje/${a.slug}/`,
    image: ogImage(c.slug),
    type: 'article',
  });
}

export default async function AttractionPage({ params }: P) {
  const { kraj, sub, attr } = await params;
  const r = resolve(kraj, sub, attr);
  if (!r) notFound();
  const { c, a } = r;
  const ct = c.content!;
  const cont = continentOf(c.continent);
  const crumbs = [
    { name: 'Kierunki', url: '/wakacje/' }, { name: cont.name, url: `/kontynenty/${cont.slug}/` },
    { name: c.name, url: `/wakacje/${c.slug}/` }, { name: 'Atrakcje', url: `/wakacje/${c.slug}/atrakcje/` }, { name: a.name },
  ];
  const others = (ct.attractions || []).filter((x) => attractionSlug(x.name) !== a.slug);
  const described = new Set(attractionsOf(c.slug).map((x) => x.slug));
  const AFF = { target: '_blank', rel: 'sponsored nofollow noopener' } as const;

  return (
    <>
      <CountryHero c={c} crumbs={crumbs} eyebrow={`Atrakcje: ${c.name}`} title={a.name} lead={a.lead} />
      <div className="wrap">
        <Tabs c={c} active="atrakcje" />
        <div className="layout section-sm">
          <article className="prose">
            <div className="at-facts">
              <div><span>Czas zwiedzania</span><b>{a.visitTime}</b></div>
              {a.forWhom && <div><span>Dla kogo</span><b>{a.forWhom}</b></div>}
            </div>

            {a.gygTourId ? (
              <GygAvailability tourId={a.gygTourId} title={`Sprawdź dostępność: ${a.name}`} />
            ) : (
              <a className="ft-card ft-link at-cta" href={gygSearchUrl(a.gygQuery)} {...AFF}>
                <span className="ft-i" aria-hidden="true">🎟</span>
                <div><h3>Bilety i wycieczki: {a.name}</h3><small>Sprawdź terminy i ceny na GetYourGuide, bezpłatne anulowanie przy wielu ofertach</small></div>
                <span className="ft-go">Sprawdź &rarr;</span>
              </a>
            )}

            <h2>{a.name}: co warto wiedzieć</h2>
            {a.intro.map((p, i) => <p key={i}>{p}</p>)}
            {a.history && (<><h2>Historia</h2><p>{a.history}</p></>)}

            <h2>Co zobaczyć na miejscu</h2>
            <div className="attr">
              {a.highlights.map((h, i) => (
                <div className="attr-item" key={i}><div className="num">{i + 1}</div><div><h3>{h.name}</h3><p>{h.text}</p></div></div>
              ))}
            </div>

            <h2>Praktyczne informacje</h2>
            <div className="at-info">
              <div><h3>Kiedy przyjechać</h3><p>{a.bestTime}</p></div>
              <div><h3>Jak dojechać</h3><p>{a.gettingThere}</p></div>
              <div><h3>Bilety i wycieczki</h3><p>{a.tickets}</p></div>
            </div>

            {a.tips.length > 0 && (<><h2>Porady przed wizytą</h2><ul>{a.tips.map((t, i) => <li key={i}>{t}</li>)}</ul></>)}

            <GygWidget q={a.gygQuery} items={4} title={`Wycieczki: ${a.name}`} />
            <SeePlaces kraj={c.slug} phrase={a.name} title={`Wycieczki fakultatywne: ${c.name}`} />

            <div className="ft-row" style={{ marginTop: 22 }}>
              <a className="ft-card ft-link" href={stayLink(`${a.name}, ${c.name}`)} {...AFF}>
                <span className="ft-i" aria-hidden="true">🛏</span><div><h3>Noclegi w pobliżu</h3><small>Hotele i apartamenty na Booking.com</small></div><span className="ft-go">&rarr;</span>
              </a>
              <a className="ft-card ft-link" href={carLink(c)} {...AFF}>
                <span className="ft-i" aria-hidden="true">🚗</span><div><h3>Wynajem auta: {c.name}</h3><small>Dojedź sam, porównaj wypożyczalnie</small></div><span className="ft-go">&rarr;</span>
              </a>
            </div>

            {a.faq.length > 0 && (<><h2>Najczęstsze pytania</h2><Faq items={a.faq} /></>)}

            {others.length > 0 && (
              <>
                <h2>Inne atrakcje: {c.name}</h2>
                <div className="at-others">
                  {others.map((o) => {
                    const s = attractionSlug(o.name);
                    return described.has(s)
                      ? <a key={s} className="chip" href={`/wakacje/${c.slug}/atrakcje/${s}/`}>{o.name}</a>
                      : <a key={s} className="chip" href={`/wakacje/${c.slug}/atrakcje/`}>{o.name}</a>;
                  })}
                </div>
              </>
            )}
            <p className="ft-note">Linki do wycieczek, noclegów i aut są linkami partnerskimi: rezerwując przez nie, nie płacisz więcej. Godziny otwarcia i ceny biletów sprawdź przed wizytą na oficjalnej stronie.</p>
          </article>
          <Aside c={c} />
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'TouristAttraction', name: a.name, description: a.lead,
        url: `${SITE.url}/wakacje/${c.slug}/atrakcje/${a.slug}/`,
        containedInPlace: { '@type': 'Country', name: c.name, url: `${SITE.url}/wakacje/${c.slug}/` },
        ...(a.forWhom ? { touristType: a.forWhom } : {}),
      }) }} />
    </>
  );
}
