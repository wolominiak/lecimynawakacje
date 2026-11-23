import WorldMap from '@/components/WorldMap';
import Search from '@/components/Search';
import { DestCard, contGradient } from '@/components/Cards';
import { CONTINENTS, MONTHS, getCountries, getByContinent, popular, warmIn } from '@/lib/data';
import { searchItems } from '@/lib/search';
import { wakacjeUrl, SITE } from '@/lib/affiliate';

export default function Home() {
  const all = getCountries();
  const withGuide = all.filter((c) => c.content);
  const regions = withGuide.reduce((n, c) => n + (c.content!.regions?.length || 0), 0);
  const top = popular(11);
  const exotic = withGuide.filter((c) => ['azja', 'ameryka-polnocna', 'afryka'].includes(c.continent) && !['egipt', 'tunezja', 'maroko', 'turcja'].includes(c.slug))
    .sort((a, b) => (b.content!.popularity || 0) - (a.content!.popularity || 0)).slice(0, 4);
  const month = new Date().getMonth();
  const now = warmIn(month).slice(0, 6);
  const quick = ['grecja', 'turcja', 'egipt', 'hiszpania', 'tajlandia', 'chorwacja'].map((s) => all.find((c) => c.slug === s)).filter(Boolean);

  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-row">
            <div>
              <span className="eyebrow" style={{ color: 'var(--gold)' }}>Przewodnik po kierunkach wakacyjnych</span>
              <h1 style={{ marginTop: 14 }}>Cały świat na <em className="s">jednej</em> mapie</h1>
              <p className="lead">Najedź na kraj, kliknij i sprawdź, kiedy jechać, które regiony wybrać i ile kosztuje wyjazd. Potem porównaj oferty biur podróży.</p>
              <div className="hero-search"><Search items={searchItems()} big /></div>
              <div className="chips">{quick.map((c) => <a key={c!.slug} className="chip" href={`/wakacje/${c!.slug}/`}>{c!.name}</a>)}</div>
            </div>
            <div className="hero-stats">
              <div><b>{all.length}</b><span>krajów i terytoriów</span></div>
              <div><b>{withGuide.length}</b><span>przewodników</span></div>
              <div><b>{regions}</b><span>regionów i wysp</span></div>
            </div>
          </div>
          <WorldMap />
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

      {now.length > 0 && (
        <section className="section" style={{ background: 'var(--sand)' }}>
          <div className="wrap">
            <div className="sec-head">
              <div><span className="eyebrow">Teraz jest ciepło</span><h2>Gdzie na wakacje {MONTHS[month].loc}?</h2></div>
              <a className="link-arrow" href={`/gdzie-na-wakacje/${MONTHS[month].slug}/`}>Pełne zestawienie &rarr;</a>
            </div>
            <div className="grid g3">
              {now.map(({ country: c, air, sea }) => (
                <a key={c.slug} className="tcard" href={`/wakacje/${c.slug}/kiedy-jechac/`}>
                  <span className="meta">{air}°C w powietrzu{sea ? `, ${sea}°C woda` : ''}</span>
                  <h3>{c.name}</h3>
                  <p>{c.content!.teaser}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <div><span className="eyebrow">Planujesz z wyprzedzeniem?</span><h2>Wybierz miesiąc wyjazdu</h2></div>
          </div>
          <div className="months">
            {MONTHS.map((m, i) => {
              const w = warmIn(i).slice(0, 3).map((x) => x.country.name).join(', ');
              return <a key={m.slug} className="month" href={`/gdzie-na-wakacje/${m.slug}/`}><b>{m.name}</b><span>{w || 'zobacz kierunki'}</span></a>;
            })}
          </div>
        </div>
      </section>

      {exotic.length > 0 && (
        <section className="section-sm">
          <div className="wrap">
            <div className="sec-head">
              <div><span className="eyebrow">Daleko, ciepło, inaczej</span><h2>Egzotyka na zimę</h2></div>
            </div>
            <div className="grid g4">{exotic.map((c) => <DestCard key={c.slug} c={c} />)}</div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <div><span className="eyebrow">Przeglądaj świat</span><h2>Kierunki według kontynentów</h2></div>
          </div>
          <div className="grid g3">
            {CONTINENTS.map((ct) => (
              <a key={ct.slug} href={`/kontynenty/${ct.slug}/`} className="cont-card" style={{ background: contGradient(ct.slug) }}>
                <h3>{ct.name}</h3>
                <p>{ct.teaser}</p>
                <span className="n">{getByContinent(ct.slug).length}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2>Szukasz wyjazdu na ostatnią chwilę?</h2>
              <p>Oferty last minute kilkudziesięciu biur podróży, z wylotem z Twojego lotniska.</p>
            </div>
            <a className="btn" href={wakacjeUrl(undefined, { lastMinute: true })} target="_blank" rel="sponsored nofollow noopener">Zobacz last minute &rarr;</a>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: SITE.url, inLanguage: 'pl-PL' }) }} />
    </>
  );
}
