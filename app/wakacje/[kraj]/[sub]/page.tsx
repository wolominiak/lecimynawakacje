import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCountries, getCountry, getRegion, continentOf, availableSubpages, MONTHS, SUBPAGES, wakacjeCountryId, wakacjeRegionId, type SubpageSlug } from '@/lib/data';
import OffersWidget from '@/components/OffersWidget';
import OffersBrowser from '@/components/OffersBrowser';
import type { Country, Region } from '@/lib/types';
import CountryHero from '@/components/CountryHero';
import Tabs from '@/components/Tabs';
import Aside from '@/components/Aside';
import Climate from '@/components/Climate';
import { GygWidget } from '@/components/Gyg';
import { gygSearchUrl, wakacjeUrl } from '@/lib/affiliate';

export const dynamicParams = false;
const YEAR = 2027;

export function generateStaticParams() {
  const out: { kraj: string; sub: string }[] = [];
  for (const c of getCountries()) {
    for (const r of c.content?.regions || []) out.push({ kraj: c.slug, sub: r.slug });
    for (const s of availableSubpages(c)) out.push({ kraj: c.slug, sub: s });
  }
  return out;
}

type P = { params: Promise<{ kraj: string; sub: string }> };

function resolve(kraj: string, sub: string) {
  const c = getCountry(kraj);
  if (!c?.content) return null;
  if (sub in SUBPAGES && availableSubpages(c).includes(sub as SubpageSlug)) return { c, sub: sub as SubpageSlug, region: null };
  const region = getRegion(c, sub);
  if (region) return { c, sub: null, region };
  return null;
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { kraj, sub } = await params;
  const r = resolve(kraj, sub);
  if (!r) return {};
  const ct = r.c.content!;
  let title = '';
  let description = '';
  if (r.region) {
    title = `Wakacje ${r.region.loc} ${YEAR} - co zobaczyć, gdzie nocować (${r.c.name})`;
    description = r.region.intro[0].slice(0, 155);
  } else if (r.sub === 'oferty') {
    title = `Wakacje ${ct.loc} ${YEAR} - aktualne oferty i ceny`;
    description = `Aktualne oferty wakacji ${ct.loc} z cenami: all inclusive, first minute i last minute od wielu biur podróży. Sprawdź, ile kosztuje wyjazd ${ct.to}.`;
  } else if (r.sub === 'kiedy-jechac') {
    title = `Kiedy jechać ${ct.to}? Pogoda i temperatura wody miesiąc po miesiącu`;
    description = `Najlepszy termin na wakacje ${ct.loc}: średnie temperatury powietrza i wody w każdym miesiącu, sezon, ceny i pogoda.`;
  } else if (r.sub === 'all-inclusive') {
    title = `All inclusive ${ct.loc} ${YEAR} - gdzie jechać i na co uważać`;
    description = `Wakacje all inclusive ${ct.loc}: najlepsze regiony, kiedy jechać, czego się spodziewać w hotelach i jak szukać tanich ofert.`;
  } else {
    title = `Atrakcje ${ct.loc} - co zobaczyć i jakie wycieczki fakultatywne wybrać`;
    description = `Najciekawsze atrakcje ${ct.loc}: zabytki, plaże, przyroda i wycieczki fakultatywne warte swojej ceny.`;
  }
  const url = `/wakacje/${r.c.slug}/${sub}/`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, url } };
}

export default async function SubPage({ params }: P) {
  const { kraj, sub } = await params;
  const r = resolve(kraj, sub);
  if (!r) notFound();
  if (r.region) return <RegionView c={r.c} r={r.region} />;
  return <SubView c={r.c} sub={r.sub!} />;
}

function RegionView({ c, r }: { c: Country; r: Region }) {
  const ct = c.content!;
  const cont = continentOf(c.continent);
  const path = r.wakacjePath || ct.wakacjePath || c.slug;
  const siblings = (ct.regions || []).filter((x) => x.slug !== r.slug);
  return (
    <>
      <CountryHero
        c={c}
        imgKey={`${c.slug}-${r.slug}`}
        eyebrow={`${c.name}${r.type ? ' / ' + r.type : ''}`}
        crumbs={[{ name: 'Kierunki', url: '/wakacje/' }, { name: cont.name, url: `/kontynenty/${cont.slug}/` }, { name: c.name, url: `/wakacje/${c.slug}/` }, { name: r.name }]}
        title={<>Wakacje {r.loc}</>}
        lead={r.forWhom}
        wakacjePath={path}
        gygQ={r.gygQuery || r.name}
      />
      <div className="wrap">
        {(r.airport || ct.practical?.flight) && (
          <dl className="facts">
            <div><dt>Kraj</dt><dd><a href={`/wakacje/${c.slug}/`}>{c.name}</a></dd></div>
            {r.airport && <div><dt>Lotnisko</dt><dd>{r.airport}</dd></div>}
            {ct.practical?.flight && <div><dt>Lot z Polski</dt><dd>{ct.practical.flight}</dd></div>}
            {ct.bestTime && <div><dt>Najlepiej</dt><dd>{ct.bestTime.best.map((m) => MONTHS[m - 1].name.slice(0, 3)).join(', ')}</dd></div>}
          </dl>
        )}
        <div className="layout section-sm">
          <article className="prose">
            <h2>{r.name}: dlaczego warto</h2>
            {r.intro.map((p, i) => <p key={i}>{p}</p>)}
            {r.highlights && <ul className="hl">{r.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>}
            {r.places?.length ? (
              <>
                <h2>Miejscowości i miejsca warte uwagi</h2>
                <div className="attr">
                  {r.places.map((p, i) => (
                    <div className="attr-item" key={i}>
                      <div className="num">{i + 1}</div>
                      <div><h3>{p.name}</h3><p>{p.text}</p></div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            {(wakacjeRegionId(c.slug, r.slug) || wakacjeCountryId(c.slug)) && (
              <>
                <h2>{wakacjeRegionId(c.slug, r.slug) ? `Oferty wakacji ${r.loc}` : `Oferty wakacji ${ct.loc}`}</h2>
                <OffersWidget region={wakacjeRegionId(c.slug, r.slug)} country={wakacjeCountryId(c.slug)} count={5} uid={`r${c.slug}-${r.slug}`} />
              </>
            )}
            <GygWidget q={r.gygQuery || r.name} title={`Wycieczki fakultatywne ${r.loc}`} />
            {ct.bestTime && (
              <>
                <h2>Pogoda i kiedy jechać</h2>
                <p>{ct.bestTime.text}</p>
                <Climate c={ct} />
              </>
            )}
            {ct.touroperator && (
              <div className="cta-band" style={{ marginTop: 40 }}>
                <div><h2>Sprawdź wakacje {r.loc}</h2><p>Oferty kilkudziesięciu biur podróży w jednym miejscu.</p></div>
                <a className="btn" href={wakacjeUrl(path)} target="_blank" rel="sponsored nofollow noopener">Zobacz oferty &rarr;</a>
              </div>
            )}
            {siblings.length > 0 && (
              <>
                <h2>Inne regiony: {c.name}</h2>
                <div className="regions">
                  {siblings.slice(0, 6).map((s) => (
                    <a key={s.slug} className="region" href={`/wakacje/${c.slug}/${s.slug}/`}>
                      {s.type && <span className="t">{s.type}</span>}
                      <h3>{s.name}</h3>
                      <p>{s.intro[0].length > 160 ? s.intro[0].slice(0, s.intro[0].lastIndexOf(' ', 150)) + '...' : s.intro[0]}</p>
                    </a>
                  ))}
                </div>
              </>
            )}
          </article>
          <Aside c={c} wakacjePath={path} ctaTitle={`Wakacje ${r.loc}`} />
        </div>
      </div>
    </>
  );
}

function SubView({ c, sub }: { c: Country; sub: SubpageSlug }) {
  const ct = c.content!;
  const cont = continentOf(c.continent);
  const crumbs = [{ name: 'Kierunki', url: '/wakacje/' }, { name: cont.name, url: `/kontynenty/${cont.slug}/` }, { name: c.name, url: `/wakacje/${c.slug}/` }, { name: SUBPAGES[sub] }];
  const titles: Record<SubpageSlug, React.ReactNode> = {
    oferty: <>Wakacje {ct.loc}: oferty i ceny</>,
    'kiedy-jechac': <>Kiedy jechać {ct.to}?</>,
    'all-inclusive': <>All inclusive {ct.loc}</>,
    atrakcje: <>Atrakcje {ct.loc}</>,
  };
  const leads: Record<SubpageSlug, string> = {
    oferty: `Aktualne oferty biur podróży z cenami za osobę. Lista odświeża się automatycznie.`,
    'kiedy-jechac': `Pogoda ${ct.loc} w każdym miesiącu: temperatury, woda, sezon i ceny. Wybierz termin pod siebie.`,
    'all-inclusive': `Gdzie szukać najlepszych hoteli all inclusive ${ct.loc} i na co zwrócić uwagę przy wyborze oferty.`,
    atrakcje: `Najciekawsze miejsca ${ct.loc} i wycieczki fakultatywne, które naprawdę warto wykupić.`,
  };
  return (
    <>
      <CountryHero c={c} crumbs={crumbs} eyebrow={c.name} title={titles[sub]} lead={leads[sub]} />
      <div className="wrap">
        <Tabs c={c} active={sub} />
        <div className="layout section-sm">
          <article className="prose">
            {sub === 'oferty' && (
              <>
                <OffersBrowser countryId={wakacjeCountryId(c.slug)!} wakacjePath={ct.wakacjePath || c.slug} loc={ct.loc} />
                <p className="muted" style={{ fontSize: '0.88rem' }}>Ceny dotyczą jednej osoby i zawierają przelot, zakwaterowanie oraz wyżywienie podane w ofercie. Liczbę osób i pokoje wybierasz na wakacje.pl po kliknięciu w ofertę.</p>
                <p><a href={wakacjeUrl(ct.wakacjePath || c.slug)} target="_blank" rel="sponsored nofollow noopener">Wszystkie oferty wakacji {ct.loc} na wakacje.pl</a></p>
                {ct.bestTime && (
                  <>
                    <h2>Kiedy wakacje {ct.loc} są najtańsze?</h2>
                    <p>{ct.bestTime.text}</p>
                    <p>Najlepszy termin to {ct.bestTime.best.map((m) => MONTHS[m - 1].name).join(', ')}. <a href={`/wakacje/${c.slug}/kiedy-jechac/`}>Pogoda {ct.loc} miesiąc po miesiącu</a>.</p>
                  </>
                )}
                {ct.allInclusive?.[0] && (
                  <>
                    <h2>Oferty all inclusive</h2>
                    <p>{ct.allInclusive[0]}</p>
                  </>
                )}
                {!!ct.regions?.length && (
                  <>
                    <h2>Dokąd {ct.to}? Regiony</h2>
                    <div className="chips">{ct.regions.map((r) => <a key={r.slug} className="chip chip-light" href={`/wakacje/${c.slug}/${r.slug}/`}>{r.name}</a>)}</div>
                  </>
                )}
              </>
            )}
            {sub === 'kiedy-jechac' && (
              <>
                <h2>Najlepszy termin na wakacje {ct.loc}</h2>
                <p>{ct.bestTime!.text}</p>
                <Climate c={ct} />
                <h2>Pogoda {ct.loc} miesiąc po miesiącu</h2>
                <table className="mtable">
                  <thead><tr><th>Miesiąc</th><th>Powietrze</th>{ct.climate!.sea && <th>Woda</th>}<th>Ocena</th></tr></thead>
                  <tbody>
                    {MONTHS.map((m, i) => {
                      const best = ct.bestTime!.best.includes(i + 1);
                      const ok = ct.bestTime!.ok?.includes(i + 1);
                      return (
                        <tr key={m.slug}>
                          <td className="n" style={{ textTransform: 'capitalize' }}><a href={`/gdzie-na-wakacje/${m.slug}/`}>{m.name}</a></td>
                          <td>{ct.climate!.air[i]}°C</td>
                          {ct.climate!.sea && <td>{ct.climate!.sea[i]}°C</td>}
                          <td>{best ? <span className="pill best">idealnie</span> : ok ? <span className="pill ok">dobrze</span> : <span className="muted">poza sezonem</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="muted" style={{ fontSize: '0.88rem', marginTop: 12 }}>Wartości to średnie wieloletnie maksymalne temperatury dzienne. W konkretnym roku mogą się różnić o kilka stopni.</p>
              </>
            )}
            {sub === 'all-inclusive' && (
              <>
                <h2>Wakacje all inclusive {ct.loc}: co trzeba wiedzieć</h2>
                {ct.allInclusive!.map((p, i) => <p key={i}>{p}</p>)}
                {!!ct.regions?.length && (
                  <>
                    <h2>Regiony z największym wyborem hoteli</h2>
                    <div className="regions">
                      {ct.regions.map((r) => (
                        <a key={r.slug} className="region" href={wakacjeUrl(r.wakacjePath || ct.wakacjePath || c.slug, { allInclusive: true })} target="_blank" rel="sponsored nofollow noopener">
                          {r.type && <span className="t">{r.type}</span>}
                          <h3>{r.name} all inclusive</h3>
                          <p>{r.forWhom || r.intro[0].slice(0, 140) + '...'}</p>
                          <div className="go">Oferty all inclusive &rarr;</div>
                        </a>
                      ))}
                    </div>
                  </>
                )}
                <div className="cta-band" style={{ marginTop: 40 }}>
                  <div><h2>All inclusive {ct.loc}</h2><p>Porównaj ceny hoteli all inclusive od wielu biur podróży.</p></div>
                  <a className="btn" href={wakacjeUrl(ct.wakacjePath || c.slug, { allInclusive: true })} target="_blank" rel="sponsored nofollow noopener">Zobacz oferty &rarr;</a>
                </div>
              </>
            )}
            {sub === 'atrakcje' && (
              <>
                <h2>Co zobaczyć {ct.loc}: lista atrakcji</h2>
                <div className="attr">
                  {ct.attractions!.map((a, i) => (
                    <div className="attr-item" key={i}>
                      <div className="num">{i + 1}</div>
                      <div>
                        <h3>{a.name}</h3>
                        <p>{a.text}</p>
                        <a className="gyg" href={gygSearchUrl(a.gygQuery || a.name)} target="_blank" rel="sponsored nofollow noopener">Bilety i wycieczki &rarr;</a>
                      </div>
                    </div>
                  ))}
                </div>
                <GygWidget q={ct.gygQuery || c.name} items={6} title={`Wycieczki fakultatywne ${ct.loc}`} />
              </>
            )}
          </article>
          <Aside c={c} />
        </div>
      </div>
    </>
  );
}
