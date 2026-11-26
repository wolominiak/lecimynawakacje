import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { seo, pick } from '@/lib/seo';
import { getCountry } from '@/lib/data';
import { allHotels, getHotel, hotelUrl, nearbyHotels, distLabel, beachLabel, hotelImg, eximOffersFor, type Hotel } from '@/lib/hotels';
import Crumbs from '@/components/Crumbs';
import Faq from '@/components/Faq';
import HotelTerms from '@/components/HotelTerms';

export const dynamicParams = false;
export function generateStaticParams() {
  return allHotels().map((h) => ({ slug: h.slug }));
}

type P = { params: Promise<{ slug: string }> };
const where = (h: Hotel) => [h.city || h.place.at(-1), h.place[0]].filter(Boolean).join(', ');

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const h = getHotel(slug);
  if (!h) return {};
  const stars = h.stars ? ` ${h.stars}*` : '';
  return seo({
    title: pick(`${h.name}${stars}, ${where(h)}: opis, opinie, ceny`, `${h.name}${stars}, ${where(h)}: opis i ceny`, `${h.name}: opis i ceny`, h.name),
    description: `${h.name}${stars} (${where(h)}): położenie${h.beachDistanceM != null ? `, ${beachLabel(h.beachDistanceM)}` : ''}, pokoje, wyżywienie, baseny, zalety i wady. Aktualne terminy i ceny wczasów.`,
    path: hotelUrl(h.slug),
    image: h.photo ? hotelImg(h.photo) : undefined,
  });
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === '' || value === false) return null;
  return <div className="hf"><small>{label}</small><b>{value === true ? 'tak' : value}</b></div>;
}

export default async function Page({ params }: P) {
  const { slug } = await params;
  const h = getHotel(slug);
  if (!h) notFound();
  const c = getCountry(h.country);
  const near = nearbyHotels(h);
  const exim = eximOffersFor(h);
  const yes = (v?: boolean | null) => (v ? true : null);
  const bbox = h.geo ? [h.geo.lon - 0.02, h.geo.lat - 0.012, h.geo.lon + 0.02, h.geo.lat + 0.012].map((x) => x.toFixed(5)).join('%2C') : '';

  const ld = {
    '@context': 'https://schema.org', '@type': 'Hotel', name: h.name, description: h.intro[0],
    ...(h.photo ? { image: hotelImg(h.photo) } : {}),
    address: { '@type': 'PostalAddress', addressLocality: h.city || h.place.at(-1), addressCountry: h.place[0], ...(h.address ? { streetAddress: h.address } : {}) },
    ...(h.geo ? { geo: { '@type': 'GeoCoordinates', latitude: h.geo.lat, longitude: h.geo.lon } } : {}),
    ...(h.stars ? { starRating: { '@type': 'Rating', ratingValue: h.stars } } : {}),
    ...(h.amenities?.length ? { amenityFeature: h.amenities.map((a) => ({ '@type': 'LocationFeatureSpecification', name: a, value: true })) } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="hero">
        <div className="wrap">
          <Crumbs items={[
            { name: 'Kierunki', url: '/wakacje/' },
            ...(c ? [{ name: c.name, url: `/wakacje/${c.slug}/` }, { name: 'Hotele', url: `/wakacje/${c.slug}/hotele/` }] : []),
            { name: h.name },
          ]} />
          <div className="hh">
            {h.photo && <img className="hh-img" src={hotelImg(h.photo)} alt={h.name} />}
            <div className="hh-body">
              {!!h.stars && <span className="ob-stars" aria-label={`Standard ${h.stars} gwiazdki`}>{'★'.repeat(Math.round(h.stars))}</span>}
              <h1>{h.name}</h1>
              <p className="hh-where">{[h.area, h.city, h.place[1] !== h.city ? h.place[1] : '', h.place[0]].filter(Boolean).join(', ')}</p>
              <div className="hh-chips">
                {h.beachDistanceM != null && <span>{beachLabel(h.beachDistanceM)}</span>}
                {h.airportKm != null && <span>{h.airportKm} km od lotniska</span>}
                {h.aquapark && <span>aquapark</span>}
                {h.kidsClub && <span>mini klub</span>}
                {h.adultsOnly && <span>tylko dla dorosłych</span>}
                {h.goodFor?.slice(0, 2).map((g) => <span key={g}>{g}</span>)}
              </div>
              <a className="btn" href="#terminy">Sprawdź terminy i ceny &rarr;</a>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap section-sm">
        <div className="layout" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <article className="prose" style={{ maxWidth: 920 }}>
            {h.intro.map((p, i) => <p key={i} className={i === 0 ? 'lead' : undefined}>{p}</p>)}

            <div className="hf-grid">
              <Fact label="Plaża" value={h.beachDistanceM != null ? `${h.beachDistanceM <= 30 ? 'przy plaży' : distLabel(h.beachDistanceM)}${h.beachType ? `, ${h.beachType}` : ''}` : h.beachType} />
              <Fact label="Plaża hotelowa" value={yes(h.privateBeach)} />
              <Fact label="Lotnisko" value={h.airportName ? `${h.airportName}${h.airportKm != null ? `, ${h.airportKm} km` : ''}` : null} />
              <Fact label="Centrum" value={h.centerKm != null ? `${String(h.centerKm).replace('.', ',')} km` : null} />
              <Fact label="Otwarcie / remont" value={h.opened ? `${h.opened}${h.renovated ? ` / ${h.renovated}` : ''}` : h.renovated ? `remont ${h.renovated}` : null} />
              <Fact label="Pokoje" value={h.rooms} />
              <Fact label="Baseny" value={h.pools ? `${h.pools}${h.heatedPool ? ', podgrzewany' : ''}` : null} />
              <Fact label="Restauracje / bary" value={h.restaurants || h.bars ? `${h.restaurants ?? '-'} / ${h.bars ?? '-'}` : null} />
              <Fact label="Aquapark" value={yes(h.aquapark)} />
              <Fact label="Mini klub" value={yes(h.kidsClub)} />
              <Fact label="Animacje" value={yes(h.animations)} />
              <Fact label="Spa" value={yes(h.spa)} />
              <Fact label="Wifi" value={yes(h.wifi)} />
            </div>

            <h2 id="terminy">Terminy i ceny: {h.name}</h2>
            {typeof h.id === 'number' && <HotelTerms id={h.id} name={h.name} />}
            {exim.length > 0 && (
              <>
                {typeof h.id === 'number' && <h3>Terminy w Exim Tours</h3>}
                <ul className="ht-list">
                  {exim.slice(0, 15).map((o) => {
                    const pp = Math.round(o.p / Math.max(1, (o.a || 0) + (o.k || 0)));
                    return (
                      <li key={o.id}>
                        <div className="ht-when"><b>{o.dd.split('-').reverse().join('.')}</b><small>{o.nn} nocy</small></div>
                        <div className="ht-what"><span>{o.b}</span><small>Wylot: {o.d}</small></div>
                        <div className="ht-price"><b>{pp.toLocaleString('pl-PL')} zł</b><small>za osobę</small></div>
                        <a className="btn btn-sm" href={'/go/exim/?u=' + encodeURIComponent(o.u)} target="_blank" rel="sponsored nofollow noopener">Zarezerwuj</a>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            {typeof h.id !== 'number' && exim.length === 0 && <div className="notice">Teraz brak wolnych terminów w tym hotelu. Zobacz podobne hotele w okolicy poniżej.</div>}

            {h.sections.map((s) => (
              <section key={s.title}>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
              </section>
            ))}

            {!!h.roomTypes?.length && (
              <>
                <h2>Rodzaje pokoi</h2>
                <ul>{h.roomTypes.map((r) => <li key={r}>{r}</li>)}</ul>
              </>
            )}

            {(h.pros.length > 0 || h.cons.length > 0) && (
              <div className="pc">
                <div className="pc-pro"><h3>Zalety</h3><ul>{h.pros.map((x) => <li key={x}>{x}</li>)}</ul></div>
                <div className="pc-con"><h3>Na co zwrócić uwagę</h3><ul>{h.cons.map((x) => <li key={x}>{x}</li>)}</ul></div>
              </div>
            )}

            {!!h.amenities?.length && (
              <>
                <h2>Udogodnienia</h2>
                <div className="chips">{h.amenities.map((a) => <span key={a} className="chip chip-light">{a}</span>)}</div>
              </>
            )}

            {h.geo && (
              <>
                <h2>Położenie hotelu na mapie</h2>
                <iframe className="hmap" title={`Mapa: ${h.name}`} loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${h.geo.lat}%2C${h.geo.lon}`} />
                <p className="ft-note">Mapa © autorzy <a href="https://www.openstreetmap.org/copyright" rel="nofollow noopener" target="_blank">OpenStreetMap</a>.</p>
              </>
            )}

            {c?.content && (
              <div className="notice">
                Przed wyjazdem: <a href={`/wakacje/${c.slug}/`}>przewodnik {c.content.loc}</a>, <a href={`/wakacje/${c.slug}/kiedy-jechac/`}>pogoda i kiedy jechać</a>, <a href={`/wakacje/${c.slug}/atrakcje/`}>atrakcje i wycieczki</a>.
              </div>
            )}

            {!!h.faq.length && (<><h2>Najczęstsze pytania</h2><Faq items={h.faq} /></>)}

            {near.length > 0 && (
              <>
                <h2>Inne hotele w okolicy</h2>
                <div className="hn">
                  {near.map((x) => (
                    <a key={x.slug} className="hn-card" href={hotelUrl(x.slug)}>
                      {x.photo && <img src={hotelImg(x.photo)} alt={x.name} loading="lazy" />}
                      <span>{!!x.stars && <i>{'★'.repeat(Math.round(x.stars))}</i>}<b>{x.name}</b><small>{x.city || x.place.at(-1)}</small></span>
                    </a>
                  ))}
                </div>
              </>
            )}

            <p className="ft-note">Opis przygotowała redakcja lecimynawakacje.pl na podstawie publicznie dostępnych informacji o hotelu (aktualizacja {h.updated.split('-').reverse().join('.')}). Szczegóły oferty, w tym zakres wyżywienia, potwierdź przed rezerwacją.</p>
          </article>
        </div>
      </div>
    </>
  );
}
