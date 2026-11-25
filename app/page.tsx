import WorldMap from '@/components/WorldMap';
import Search from '@/components/Search';
import { DestCard } from '@/components/Cards';
import { CONTINENTS, MONTHS, getCountries, getByContinent, popular, warmIn } from '@/lib/data';
import { wakacjeUrl, SITE } from '@/lib/affiliate';

const MONTH_TAG = ['Ferie', 'Ferie', 'Przedwiośnie', 'Wielkanoc', 'Majówka', 'Początek lata', 'Wakacje', 'Wakacje', 'Po sezonie', 'Złota jesień', 'Ucieczka od szarości', 'Święta'];

export default function Home() {
  const all = getCountries();
  const withGuide = all.filter((c) => c.content);
  const regions = withGuide.reduce((n, c) => n + (c.content!.regions?.length || 0), 0);
  const top = popular(11);
  const month = new Date().getMonth();
  const quick: [string, string][] = [
    ['Grecja', '/wakacje/grecja/'], ['Turcja', '/wakacje/turcja/'], ['Egipt', '/wakacje/egipt/'],
    ['Teneryfa', '/wakacje/hiszpania/teneryfa/'], ['Tajlandia', '/wakacje/tajlandia/'], ['Zanzibar', '/wakacje/tanzania/zanzibar/'],
  ];
  // kalendarz od bieżącego miesiąca
  const cal = Array.from({ length: 12 }, (_, k) => (month + k) % 12);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="hero-panel">
            <div className="hero-top">
              <h1>Gdzie chcesz polecieć na wakacje?</h1>
              <div>
                <p className="lead">Wybierz kraj na mapie albo wpisz kierunek. Podpowiemy, kiedy jechać, które regiony wybrać i ile kosztuje wyjazd.</p>
                <div className="hero-search"><Search big /></div>
                <div className="chips">{quick.map(([n, u]) => <a key={u} className="chip" href={u}>{n}</a>)}</div>
              </div>
            </div>
            <WorldMap />
            <div className="hero-stats">
              <div><b>{all.length}</b><span>krajów i terytoriów</span></div>
              <div><b>{withGuide.length}</b><span>przewodników</span></div>
              <div><b>{regions}</b><span>regionów i wysp</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <div><span className="eyebrow">Najczęściej wybierane</span><h2>Popularne kierunki wakacyjne</h2></div>
            <a className="link-arrow" href="/wakacje/">Wszystkie kraje &rarr;</a>
          </div>
          <div className="grid g4">
            {top.map((c, i) => <DestCard key={c.slug} c={c} big={i === 0} tag={i === 0 ? 'Numer 1 wśród Polaków' : undefined} />)}
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="wrap">
          <div className="sec-head">
            <div><span className="eyebrow">Kiedy gdzie jest ciepło</span><h2>Kalendarz wyjazdów</h2></div>
            <a className="link-arrow" href="/gdzie-na-wakacje/">Cały rok &rarr;</a>
          </div>
          <div className="cal">
            {cal.map((i, k) => {
              const w = warmIn(i).slice(0, 3).map((x) => x.country.name).join(', ');
              return (
                <a key={MONTHS[i].slug} href={`/gdzie-na-wakacje/${MONTHS[i].slug}/`} className={k === 0 ? 'now' : ''}>
                  <span className="k">{k === 0 ? 'Teraz' : MONTH_TAG[i]}</span>
                  <b>{MONTHS[i].name}</b>
                  <span className="w">{w || 'zobacz kierunki'}</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="feat">
            <a href={wakacjeUrl(undefined, { allInclusive: true })} target="_blank" rel="sponsored nofollow noopener">
              <b>All inclusive</b>
              <span>Hotele z pełnym wyżywieniem w Turcji, Egipcie, Grecji i na Karaibach od kilkudziesięciu biur podróży.</span>
              <em>Sprawdź oferty &rarr;</em>
            </a>
            <a href="/last-minute/">
              <b>Last minute</b>
              <span>Wyloty w najbliższych dniach z polskich lotnisk, często w dużo niższej cenie.</span>
              <em>Zobacz wyloty &rarr;</em>
            </a>
            <a href="/kontynenty/azja/" className="hot">
              <b>Egzotyka na zimę</b>
              <span>Tajlandia, Malediwy, Dominikana, Zanzibar i inne kierunki, gdzie w grudniu jest 30 stopni.</span>
              <em>Wybierz kierunek &rarr;</em>
            </a>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="wrap">
          <div className="sec-head">
            <div><span className="eyebrow">Przeglądaj świat</span><h2>Kierunki według kontynentów</h2></div>
          </div>
          <div className="grid g3">
            {CONTINENTS.map((ct) => (
              <a key={ct.slug} href={`/kontynenty/${ct.slug}/`} className="tcard">
                <span className="meta">{getByContinent(ct.slug).length} krajów</span>
                <h3>{ct.name}</h3>
                <p>{ct.teaser}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: SITE.url, inLanguage: 'pl-PL', publisher: { '@id': SITE.url + '/#org' } },
        { '@context': 'https://schema.org', '@type': 'Organization', '@id': SITE.url + '/#org', name: SITE.name, url: SITE.url, logo: SITE.url + '/favicon.svg',
          address: { '@type': 'PostalAddress', streetAddress: 'Aðalstræti 24', postalCode: '400', addressLocality: 'Ísafjörður', addressCountry: 'IS' }, legalName: 'Gjafaland ehf.' },
      ]) }} />
    </>
  );
}
