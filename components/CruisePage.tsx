import CruiseBrowser from './CruiseBrowser';
import Crumbs from './Crumbs';
import Faq from './Faq';
import { CRUISE_AREAS, type CruiseArea } from '@/lib/cruises';
import { imageFor, photoCredit } from '@/lib/images';

const GENERAL_FAQ = [
  { q: 'Co jest w cenie rejsu?', a: 'Zwykle kabina na wybranym statku, pełne wyżywienie w restauracjach i bufetach, część napojów, rozrywka na pokładzie, opłaty portowe, a w ofertach z przelotem także lot z Polski i transfer do portu. Dokładny zakres jest w opisie oferty.' },
  { q: 'Za co trzeba dopłacić na statku?', a: 'Najczęściej za opłaty serwisowe (napiwki naliczane za każdą noc), napoje spoza pakietu, wycieczki fakultatywne w portach, spa i restauracje specjalne. Opłaty serwisowe warto wliczyć w budżet od razu.' },
  { q: 'Jaką kabinę wybrać?', a: 'Kabina wewnętrzna jest najtańsza i wystarczy, jeśli w kabinie głównie śpisz. Kabina z oknem daje dzienne światło, a z balkonem pozwala oglądać wpływanie do portu i morze bez wychodzenia. Na fiordach i dalekich trasach balkon jest szczególnie wart dopłaty.' },
  { q: 'Czy ceny rejsów są za osobę?', a: 'Tak. Podajemy cenę za jedną osobę przy zakwaterowaniu dwóch osób w kabinie. Liczbę osób i rodzaj kabiny wybierasz na wakacje.pl po kliknięciu w ofertę.' },
  { q: 'Czy na rejsie jest choroba morska?', a: 'Duże statki wycieczkowe mają stabilizatory i na spokojnych akwenach, jak Morze Śródziemne czy Karaiby, kołysanie jest słabo odczuwalne. Najmniej kołysze w kabinach na niższych pokładach, w środkowej części statku.' },
];

export default function CruisePage({ area }: { area?: CruiseArea }) {
  const key = area ? `rejsy-${area.slug}` : 'rejsy';
  const img = imageFor(key) || imageFor('rejsy');
  const credit = img ? photoCredit(imageFor(key) ? key : 'rejsy') : null;
  return (
    <>
      <section className={'chero' + (img ? ' has-img' : '')}>
        {img && <img className="himg" src={img} alt="" fetchPriority="high" />}
        {credit && <a className="hcredit" href={credit.url} target="_blank" rel="nofollow noopener">Fot. {credit.by} / {credit.src || 'Pexels'}</a>}
        <div className="wrap">
          <div style={{ position: 'relative', zIndex: 2, paddingTop: 22 }}>
            <Crumbs items={area ? [{ name: 'Rejsy', url: '/rejsy/' }, { name: area.name }] : [{ name: 'Rejsy' }]} />
          </div>
          <div className="chero-in cr-hero">
            <div>
              <span className="eyebrow" style={{ color: '#d9eef6' }}>Rejsy wycieczkowe</span>
              <h1 style={{ marginTop: 12 }}>{area ? area.title : 'Rejsy wycieczkowe'}</h1>
              <p className="lead">{area ? area.teaser : 'Rejsy MSC i Costa z polskich biur podróży, z przelotem albo dojazdem własnym. Wybierz akwen, miesiąc i budżet, a lista od razu się zawęzi.'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap section-sm">
        <div className="chips cr-areas">
          <a className={'chip' + (!area ? ' on' : '')} href="/rejsy/">Wszystkie rejsy</a>
          {CRUISE_AREAS.map((a) => <a key={a.slug} className={'chip' + (area?.slug === a.slug ? ' on' : '')} href={`/rejsy/${a.slug}/`}>{a.short}</a>)}
        </div>
        <CruiseBrowser initialArea={area?.slug || ''} />
      </div>

      <div className="wrap section-sm">
        <div className="layout" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <article className="prose" style={{ maxWidth: 860 }}>
            {area ? (
              <>
                <h2>{area.title}: co warto wiedzieć</h2>
                {area.intro.map((p, i) => <p key={i}>{p}</p>)}
                <h3>Kiedy płynąć?</h3>
                <p>{area.when}</p>
                <h3>Najczęstsze porty</h3>
                <p>{area.ports}</p>
              </>
            ) : (
              <>
                <h2>Jak wybrać pierwszy rejs?</h2>
                <p>Na pierwszy raz najlepiej sprawdza się tygodniowy rejs po Morzu Śródziemnym z przelotem z Polski. Statek co dzień zawija do innego portu, a Ty rozpakowujesz walizkę tylko raz. Zimą warto spojrzeć na Wyspy Kanaryjskie i Karaiby, a latem na fiordy norweskie.</p>
                <p>Porównując oferty, patrz nie tylko na cenę, ale też na długość rejsu, liczbę portów i to, czy w cenie jest przelot. Pomaga sortowanie "Najtańsze za dzień", które pokazuje, ile realnie kosztuje każdy dzień na statku.</p>
                <div className="cr-grid">
                  {CRUISE_AREAS.map((a) => {
                    const im = imageFor(`rejsy-${a.slug}`, 'small');
                    return (
                      <a key={a.slug} className="region" href={`/rejsy/${a.slug}/`}>
                        {im && <img className="rimg" src={im} alt={a.title} loading="lazy" />}
                        <span className="t">Akwen</span>
                        <h3>{a.title}</h3>
                        <p>{a.teaser}</p>
                        <div className="go">Zobacz rejsy &rarr;</div>
                      </a>
                    );
                  })}
                </div>
              </>
            )}
            <h2>Najczęstsze pytania o rejsy</h2>
            <Faq items={[...(area?.faq || []), ...GENERAL_FAQ]} />
          </article>
        </div>
      </div>
    </>
  );
}
