import type { Metadata } from 'next';
import { seo, ogImage, pick } from '@/lib/seo';
import { SITE } from '@/lib/affiliate';
import { imageFor } from '@/lib/images';
import { notFound } from 'next/navigation';
import { getCountries, getCountry, getCountryByCode, continentOf, isIndexable, MONTHS, availableSubpages, wakacjeCountryId } from '@/lib/data';
import CountryHero from '@/components/CountryHero';
import Tabs from '@/components/Tabs';
import Aside from '@/components/Aside';
import Climate from '@/components/Climate';
import Faq from '@/components/Faq';
import { GygWidget } from '@/components/Gyg';
import { gygSearchUrl } from '@/lib/affiliate';
import { EsimSection } from '@/components/Esim';
import SelfTravel from '@/components/SelfTravel';
import { GuideDeals } from '@/components/Promo';

export const dynamicParams = false;
export function generateStaticParams() {
  return getCountries().map((c) => ({ kraj: c.slug }));
}

type P = { params: Promise<{ kraj: string }> };

// Od września pokazujemy kolejny rok (ludzie szukają już "wakacje 2027")
const YEAR = new Date().getMonth() >= 8 ? new Date().getFullYear() + 1 : new Date().getFullYear();

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { kraj } = await params;
  const c = getCountry(kraj);
  if (!c) return {};
  const ct = c.content;
  const title = ct ? pick(`Wakacje ${ct.loc} ${YEAR} - kiedy jechać, regiony, atrakcje`, `Wakacje ${ct.loc} ${YEAR} - kiedy jechać i co zobaczyć`, `Wakacje ${ct.loc} ${YEAR} - przewodnik`, `Wakacje ${ct.loc} ${YEAR}`) : `${c.name} - wakacje i podróże, informacje praktyczne`;
  return seo({
    title,
    description: ct?.teaser || `${c.name}: waluta, język, sąsiednie kraje, wycieczki i atrakcje. Informacje dla podróżujących z Polski.`,
    path: `/wakacje/${c.slug}/`,
    image: ogImage(c.slug),
    noindex: !isIndexable(c),
    type: 'article',
  });
}

export default async function CountryPage({ params }: P) {
  const { kraj } = await params;
  const c = getCountry(kraj);
  if (!c) notFound();
  const ct = c.content;
  const cont = continentOf(c.continent);
  const subs = availableSubpages(c);
  const neighbors = c.neighbors.map(getCountryByCode).filter(Boolean);
  const crumbs = [{ name: 'Kierunki', url: '/wakacje/' }, { name: cont.name, url: `/kontynenty/${cont.slug}/` }, { name: c.name }];

  const facts: [string, string][] = [];
  if (ct?.capital) facts.push(['Stolica', ct.capital]);
  if (c.currencies.length) facts.push(['Waluta', c.currencies.map((x) => `${x.name} (${x.code})`).join(', ')]);
  if (c.languages.length) facts.push(['Język', c.languages.slice(0, 3).join(', ')]);
  if (ct?.practical?.flight) facts.push(['Lot z Polski', ct.practical.flight]);
  if (ct?.practical?.timeDiff) facts.push(['Różnica czasu', ct.practical.timeDiff]);
  if (ct?.bestTime) facts.push(['Najlepiej', ct.bestTime.best.map((m) => MONTHS[m - 1].name.slice(0, 3)).join(', ')]);

  return (
    <>
      <CountryHero
        c={c}
        crumbs={crumbs}
        eyebrow={cont.name}
        title={ct ? <>Wakacje {ct.loc}</> : c.name}
        lead={ct?.teaser || `Podstawowe informacje o kraju ${c.name} dla podróżujących z Polski: waluta, język, sąsiedzi, wycieczki i atrakcje na miejscu.`}
      />
      <div className="wrap">
        {facts.length > 0 && (
          <dl className="facts">{facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        )}
        <Tabs c={c} active="" />
        <div className="layout section-sm">
          <article className="prose">
            {ct ? (
              <>
                <h2>{c.name} na wakacje: co warto wiedzieć</h2>
                {ct.intro.map((p, i) => <p key={i}>{p}</p>)}
                {ct.highlights && <ul className="hl">{ct.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>}
                {wakacjeCountryId(c.slug) && <GuideDeals countryId={wakacjeCountryId(c.slug)!} loc={ct.loc} allHref={`/wakacje/${c.slug}/oferty/`} />}

                {!!ct.regions?.length && (
                  <>
                    <h2>Najlepsze regiony i miejsca na wakacje {ct.loc}</h2>
                    <div className="regions">
                      {ct.regions.map((r) => (
                        <a key={r.slug} className="region" href={`/wakacje/${c.slug}/${r.slug}/`}>
                          {imageFor(`${c.slug}-${r.slug}`, 'small') && <img className="rimg" src={imageFor(`${c.slug}-${r.slug}`, 'small')!} alt={r.name} loading="lazy" />}
                          {r.type && <span className="t">{r.type}</span>}
                          <h3>{r.name}</h3>
                          <p>{r.intro[0].length > 200 ? r.intro[0].slice(0, r.intro[0].lastIndexOf(' ', 190)) + '...' : r.intro[0]}</p>
                          <div className="go">Wakacje {r.loc} &rarr;</div>
                        </a>
                      ))}
                    </div>
                  </>
                )}

                {ct.bestTime && (
                  <>
                    <h2>Kiedy jechać {ct.to}?</h2>
                    <p>{ct.bestTime.text}</p>
                    <Climate c={ct} />
                    {subs.includes('kiedy-jechac') && <p style={{ marginTop: 16 }}><a href={`/wakacje/${c.slug}/kiedy-jechac/`}>Pogoda {ct.loc} miesiąc po miesiącu</a></p>}
                  </>
                )}

                {!!ct.attractions?.length && (
                  <>
                    <h2>Co zobaczyć {ct.loc}?</h2>
                    <div className="attr">
                      {ct.attractions.slice(0, 6).map((a, i) => (
                        <div className="attr-item" key={i}>
                          <div className="num">{i + 1}</div>
                          <div>
                            <h3>{a.name}</h3>
                            <p>{a.text}</p>
                            {a.gygQuery && <a className="gyg" href={gygSearchUrl(a.gygQuery)} target="_blank" rel="sponsored nofollow noopener">Bilety i wycieczki &rarr;</a>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {subs.includes('atrakcje') && ct.attractions.length > 6 && <p style={{ marginTop: 16 }}><a href={`/wakacje/${c.slug}/atrakcje/`}>Wszystkie atrakcje ({ct.attractions.length})</a></p>}
                  </>
                )}

                <GygWidget q={ct.gygQuery || c.name} title={`Najpopularniejsze wycieczki ${ct.loc}`} />

                {ct.allInclusive && (
                  <>
                    <h2>All inclusive {ct.loc}</h2>
                    <p>{ct.allInclusive[0]}</p>
                    <p><a href={`/wakacje/${c.slug}/all-inclusive/`}>Gdzie najlepiej na all inclusive {ct.loc}</a></p>
                  </>
                )}

                {ct.cuisine && (
                  <>
                    <h2>Kuchnia: czego spróbować</h2>
                    {ct.cuisine.map((p, i) => <p key={i}>{p}</p>)}
                  </>
                )}

                <SelfTravel c={c} />

                {ct.practical && (
                  <>
                    <h2>Informacje praktyczne</h2>
                    {ct.practical.documents && <><h3>Dokumenty i wizy</h3><p>{ct.practical.documents}</p></>}
                    {ct.practical.money && <><h3>Pieniądze i ceny</h3><p>{ct.practical.money}</p></>}
                    {ct.practical.plugs && <><h3>Gniazdka</h3><p>{ct.practical.plugs}</p></>}
                    <EsimSection c={c} loc={ct.loc} />
                    {ct.practical.language && <><h3>Język</h3><p>{ct.practical.language}</p></>}
                    {ct.practical.safety && <><h3>Bezpieczeństwo i zdrowie</h3><p>{ct.practical.safety}</p></>}
                    <p className="notice">Przepisy wjazdowe się zmieniają. Przed wyjazdem sprawdź aktualne informacje MSZ na stronie <a href="https://www.gov.pl/web/dyplomacja/informacje-dla-podrozujacych" target="_blank" rel="noopener">gov.pl/dyplomacja</a>.</p>
                  </>
                )}

                {!!ct.faq?.length && (
                  <>
                    <h2>Najczęstsze pytania</h2>
                    <Faq items={ct.faq} />
                  </>
                )}
              </>
            ) : (
              <>
                <h2>{c.name}: podstawowe informacje</h2>
                <p>
                  {c.name} leży na kontynencie: {cont.name}.{c.landlocked ? ' Kraj nie ma dostępu do morza.' : ''} Powierzchnia wynosi około {Math.round(c.area).toLocaleString('pl-PL')} km².
                  {c.languages.length ? ` Język urzędowy: ${c.languages.join(', ')}.` : ''}
                  {c.currencies.length ? ` Płaci się w walucie ${c.currencies.map((x) => `${x.name} (${x.code})`).join(', ')}.` : ''}
                </p>
                <p className="notice">Pełny przewodnik po tym kierunku jest w przygotowaniu. Na razie zobacz wycieczki i atrakcje dostępne na miejscu.</p>
                <GygWidget q={c.name} title={`Wycieczki i atrakcje: ${c.name}`} />
              </>
            )}

            {neighbors.length > 0 && (
              <>
                <h2>Kraje sąsiednie</h2>
                <div className="chips">
                  {neighbors.map((n) => <a key={n!.slug} className="chip chip-light" href={`/wakacje/${n!.slug}/`}>{n!.name}</a>)}
                </div>
              </>
            )}
          </article>
          <Aside c={c} />
        </div>
      </div>
      {ct && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'TouristDestination', name: c.name, description: ct.teaser,
          url: `${SITE.url}/wakacje/${c.slug}/`, touristType: ['Wypoczynek', 'Zwiedzanie'],
          ...(imageFor(c.slug) ? { image: SITE.url + imageFor(c.slug) } : {}),
          ...(c.latlng ? { geo: { '@type': 'GeoCoordinates', latitude: c.latlng[0], longitude: c.latlng[1] } } : {}),
          ...(ct.regions?.length ? { includesAttraction: ct.regions.map((r) => ({ '@type': 'TouristDestination', name: r.name, url: `${SITE.url}/wakacje/${c.slug}/${r.slug}/` })) } : {}),
        }) }} />
      )}
    </>
  );
}
