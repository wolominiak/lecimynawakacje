import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { seo, pick, ogImage } from '@/lib/seo';
import { getCountry, getRegion, wakacjeCountryId } from '@/lib/data';
import { allRoutes, getRoute, routeUrl, searchHref, transfersLabel, monthRows, monthShort, monthLoc, fmtDay, zl } from '@/lib/flights';
import Crumbs from '@/components/Crumbs';
import Faq from '@/components/Faq';
import FlightForm from '@/components/FlightForm';
import { liveRoute, checkedAt } from '@/lib/flights-live';

// ceny odświeżane z API najwyżej co 15 minut (przy wejściu odwiedzającego)
export const revalidate = 900;

export const dynamicParams = false;
export function generateStaticParams() {
  return allRoutes().map((r) => ({ trasa: r.slug }));
}

type P = { params: Promise<{ trasa: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { trasa } = await params;
  const base = getRoute(trasa);
  if (!base) return {};
  const r = await liveRoute(base);
  const c = getCountry(r.country);
  return seo({
    title: pick(`Tanie loty ${r.oName} - ${r.name} od ${zl(r.price)} | ceny w miesiącach`, `Tanie loty ${r.oName} - ${r.name} od ${zl(r.price)}`, `Loty ${r.oName} - ${r.name} od ${zl(r.price)}`),
    description: `Loty ${r.oFrom} do: ${r.name}${c ? ` (${c.name})` : ''} od ${zl(r.price)} w obie strony. Ceny w kolejnych miesiącach, najtańsze terminy i porównanie linii lotniczych.`,
    path: routeUrl(r.slug),
    image: ogImage(`${r.country}-${r.region}`, r.country),
  });
}

export default async function Page({ params }: P) {
  const { trasa } = await params;
  const base = getRoute(trasa);
  if (!base) notFound();
  const r = await liveRoute(base);
  const at = checkedAt();
  const c = getCountry(r.country);
  const reg = c ? getRegion(c, r.region) : undefined;
  const rows = monthRows(r);
  const max = Math.max(...rows.map(([, p]) => p), 1);
  const best = rows.reduce<[string, number] | null>((m, x) => (!m || x[1] < m[1] ? x : m), null);
  const worst = rows.reduce<[string, number] | null>((m, x) => (!m || x[1] > m[1] ? x : m), null);
  const all = allRoutes();
  const otherOrigins = all.filter((x) => x.d === r.d && x.o !== r.o).sort((a, b) => a.price - b.price);
  const sameCountry = all.filter((x) => x.o === r.o && x.country === r.country && x.d !== r.d).sort((a, b) => a.price - b.price).slice(0, 8);
  const flightTime = c?.content?.practical?.flight;
  const title = `Tanie loty ${r.oName} - ${r.name}`;

  const faq = [
    { q: `Ile kosztuje lot ${r.oFrom} do: ${r.name}?`, a: `Dziś najtańszy lot w obie strony kosztuje ${zl(r.price)} za osobę${r.dep ? ` (wylot ${fmtDay(r.dep)}${r.ret ? `, powrót ${fmtDay(r.ret)}` : ''})` : ''}. Ceny tanich lotów zmieniają się kilka razy dziennie.` },
    ...(best && worst && best[0] !== worst[0] ? [{ q: `Kiedy najtaniej polecieć ${r.oFrom} do: ${r.name}?`, a: `Najtaniej jest ${monthLoc(best[0])} (od ${zl(best[1])}), a najdrożej ${monthLoc(worst[0])} (od ${zl(worst[1])}).` }] : []),
    ...(flightTime ? [{ q: `Ile trwa lot z Polski${c ? ` do kraju ${c.name}` : ''}?`, a: flightTime }] : []),
    { q: 'Czy cena obejmuje bagaż?', a: 'To zależy od linii i taryfy. Tanie linie w najniższej cenie mają zwykle tylko mały bagaż podręczny. Przed zakupem sprawdź warunki w wynikach wyszukiwania.' },
  ];

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <Crumbs items={[{ name: 'Loty', url: '/loty/' }, { name: `${r.oName} - ${r.name}` }]} />
          <div className="hero-panel lm-hero">
            <span className="eyebrow">Loty {r.oFrom}{c ? `, ${c.name}` : ''}</span>
            <h1>{title}</h1>
            <p className="lead">
              Dzisiejsza okazja: lot w obie strony za <b>{zl(r.price)}</b> za osobę
              {r.dep && <>, wylot {fmtDay(r.dep)}{r.ret && <>, powrót {fmtDay(r.ret)}</>}</>}
              {r.transfers != null && <>, {transfersLabel(r.transfers)}</>}.
            </p>
            <p><a className="btn" href={searchHref(r, r.dep, r.ret)} target="_blank" rel="sponsored nofollow noopener">Zarezerwuj ten lot &rarr;</a></p>
            <p className="fl-live">{r.live ? <>Cena sprawdzona dziś o {at}, aktualizacja co 15 minut. Tanie bilety szybko znikają, rezerwuj, póki cena jest aktualna.</> : <>Tanie bilety szybko znikają, rezerwuj, póki cena jest aktualna.</>}</p>
          </div>
        </div>
      </section>

      <div className="wrap section-sm">
        <div className="layout" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <article className="prose" style={{ maxWidth: 900 }}>
            <section className="ft-card ft-fly" style={{ margin: '0 0 28px' }}>
              <h2 style={{ marginTop: 0 }}>Wyszukaj lot {r.oFrom} do: {r.name}</h2>
              <FlightForm dest={r.d} destName={r.name} origin={r.o} />
            </section>

            {rows.length > 1 && (
              <>
                <h2>Ceny lotów {r.oName} - {r.name} w kolejnych miesiącach</h2>
                <p>Najniższa cena biletu w obie strony w danym miesiącu, aktualizowana co 15 minut. Kliknij miesiąc, żeby sprawdzić lot w tym terminie.</p>
                <div className="fl-months">
                  {rows.map(([m, p]) => (
                    <a key={m} className={'fl-m' + (best && m === best[0] ? ' best' : '')} href={r.monthDates?.[m] ? searchHref(r, r.monthDates[m][0], r.monthDates[m][1]) : searchHref(r, `${m}-15`)} title={r.monthDates?.[m] ? `${fmtDay(r.monthDates[m][0])}${r.monthDates[m][1] ? ` - ${fmtDay(r.monthDates[m][1])}` : ''}` : undefined} target="_blank" rel="sponsored nofollow noopener">
                      <span className="fl-bar"><i style={{ height: `${Math.max(12, Math.round((p / max) * 100))}%` }} /></span>
                      <b>{zl(p)}</b>
                      <small>{monthShort(m)}</small>
                      {r.monthDates?.[m] && <small className="fl-d">{r.monthDates[m][0].slice(8, 10)}.{r.monthDates[m][0].slice(5, 7)}{r.monthDates[m][1] ? ` - ${r.monthDates[m][1]!.slice(8, 10)}.${r.monthDates[m][1]!.slice(5, 7)}` : ''}</small>}
                    </a>
                  ))}
                </div>
                {best && <p className="notice">Najtaniej: {monthLoc(best[0])}, od {zl(best[1])} za osobę w obie strony.</p>}
              </>
            )}

            {c?.content && (
              <>
                <h2>{reg ? reg.name : c.name}: co warto wiedzieć przed wylotem</h2>
                {reg ? <p>{reg.intro[0]}</p> : <p>{c.content.teaser}</p>}
                <ul className="hl">
                  {reg?.airport && <li>Lotnisko: {reg.airport}</li>}
                  {flightTime && <li>Lot z Polski: {flightTime}</li>}
                  {c.content.practical?.documents && <li>Dokumenty: {c.content.practical.documents}</li>}
                </ul>
                <p>
                  <a href={reg ? `/wakacje/${c.slug}/${reg.slug}/` : `/wakacje/${c.slug}/`}>Przewodnik: {reg ? reg.name : c.name}</a>
                  {' · '}<a href={`/wakacje/${c.slug}/hotele/`}>Noclegi</a>
                  {' · '}<a href={`/wakacje/${c.slug}/atrakcje/`}>Atrakcje</a>
                </p>
                {wakacjeCountryId(c.slug) && (
                  <div className="notice">Wolisz wczasy z lotem, transferem i hotelem w jednej cenie? <a href={`/wakacje/${c.slug}/oferty/`}>Zobacz oferty biur podróży {c.content.loc}</a>.</div>
                )}
              </>
            )}

            {otherOrigins.length > 0 && (
              <>
                <h2>Loty do: {r.name} z innych miast</h2>
                <div className="chips">
                  {otherOrigins.map((x) => <a key={x.slug} className="chip chip-light" href={routeUrl(x.slug)}>{x.oName}: od {zl(x.price)}</a>)}
                </div>
              </>
            )}
            {sameCountry.length > 0 && c && (
              <>
                <h2>Inne loty {r.oFrom}: {c.name}</h2>
                <div className="chips">
                  {sameCountry.map((x) => <a key={x.slug} className="chip chip-light" href={routeUrl(x.slug)}>{x.name}: od {zl(x.price)}</a>)}
                </div>
              </>
            )}

            <h2>Najczęstsze pytania</h2>
            <Faq items={faq} />
            <p className="ft-note">Ceny za jedną osobę w obie strony, aktualizowane co 15 minut. Dostępność biletów w danej cenie jest ograniczona. Linki partnerskie.</p>
          </article>
        </div>
      </div>
    </>
  );
}
