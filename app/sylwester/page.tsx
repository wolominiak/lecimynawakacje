import type { Metadata } from 'next';
import { seo } from '@/lib/seo';
import Crumbs from '@/components/Crumbs';
import Faq from '@/components/Faq';
import CategoryBar from '@/components/CategoryBar';
import { imageFor } from '@/lib/images';
import { NY, NY_WARM, NY_CITIES, NY_TIPS, NY_FAQ, decemberFlight } from '@/lib/sylwester';

export const metadata: Metadata = seo({
  title: `Sylwester ${NY.year - 1}/${NY.year} za granicą - oferty w ciepłych krajach i city break`,
  description: 'Gdzie na sylwestra za granicę? Oferty biur podróży na przełom roku w Egipcie, na Kanarach, w Dubaju i na Maderze oraz tanie loty na sylwestra do Rzymu, Pragi, Barcelony i Londynu.',
  path: '/sylwester/',
});

const fmt = (n: number) => n.toLocaleString('pl-PL');
const flightHref = (o: string, d: string) => `/go/lot/?o=${o}&d=${d}&dd=${NY.dep}&rd=${NY.ret}&a=2`;

export default function Page() {
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <Crumbs items={[{ name: 'Sylwester' }]} />
          <div className="hero-panel lm-hero">
            <span className="eyebrow">Sylwester {NY.year - 1}/{NY.year}</span>
            <h1>Sylwester za granicą</h1>
            <p className="lead">Przywitaj {NY.year} rok na plaży w Egipcie, pod fajerwerkami w Dubaju albo na city breaku w Rzymie. Zebraliśmy kierunki, oferty biur podróży na przełom roku i loty na sylwestra.</p>
            <div className="hero-cta">
              <a className="btn" href="/go/sylwester/" target="_blank" rel="sponsored nofollow noopener">Wszystkie oferty sylwestrowe</a>
              <a className="btn btn-ghost" href="#miasta">Sylwester w mieście</a>
            </div>
          </div>
        </div>
      </section>
      <div className="wrap"><CategoryBar active="sylwester" /></div>

      <section className="wrap section-sm">
        <div className="sec-head"><div><span className="eyebrow">Ciepłe kraje</span><h2>Sylwester na plaży</h2></div></div>
        <p className="ny-note">Przycisk "Oferty na sylwestra" otwiera wyszukiwarkę wakacje.pl z terminami na przełom roku od kilkudziesięciu biur podróży.</p>
        <div className="ny-grid">
          {NY_WARM.map((w) => {
            const img = imageFor(w.img, 'small');
            return (
              <div key={w.path} className="ny-card">
                <div className="ny-img" style={img ? { backgroundImage: `url(${img})` } : undefined}><span>{w.temp}</span></div>
                <div className="ny-body">
                  <h3>{w.name}</h3>
                  <p>{w.text}</p>
                  <div className="ny-actions">
                    <a className="btn" href={`/go/sylwester/${w.path}/`} target="_blank" rel="sponsored nofollow noopener">Oferty na sylwestra</a>
                    <a className="ny-link" href={w.guide}>Przewodnik</a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="wrap section-sm" id="miasta">
        <div className="sec-head"><div><span className="eyebrow">City break</span><h2>Sylwester w europejskim mieście</h2></div></div>
        <p className="ny-note">Loty z wylotem 30 grudnia i powrotem 2 stycznia dla 2 osób. Cena "od" to najtańszy lot w grudniu z naszych codziennych danych, na przełom roku bywa wyższa.</p>
        <div className="ny-grid">
          {NY_CITIES.map((c) => {
            const img = imageFor(c.img, 'small');
            const f = decemberFlight(c.iata);
            return (
              <div key={c.iata} className="ny-card">
                <div className="ny-img" style={img ? { backgroundImage: `url(${img})` } : undefined}>{f && <span>loty w grudniu od {fmt(f.price)} zł</span>}</div>
                <div className="ny-body">
                  <h3>{c.name}</h3>
                  <p>{c.text}</p>
                  <div className="ny-actions">
                    <a className="btn" href={flightHref(f?.o || 'WAW', c.iata)} rel="nofollow">Loty 30.12-02.01</a>
                    <a className="ny-link" href={`/go/nocleg/?q=${encodeURIComponent(c.name)}`} target="_blank" rel="sponsored nofollow noopener">Hotele</a>
                    {c.guide && <a className="ny-link" href={c.guide}>Przewodnik</a>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="wrap section-sm">
        <article className="prose" style={{ maxWidth: 860 }}>
          <h2>Jak zaplanować sylwestra za granicą</h2>
          <p>Wyjazd na przełom roku to najbardziej oblegany termin zimy. Biura podróży przygotowują osobne oferty sylwestrowe, a hotele organizują uroczyste kolacje i zabawy do rana. Najwięcej Polaków wybiera Egipt i Wyspy Kanaryjskie, coraz popularniejsze są też Dubaj, Madera i Zanzibar.</p>
          <p>Jeśli wolisz miasto, wystarczy krótki wyjazd: tani lot, hotel blisko centrum i plan, gdzie oglądać fajerwerki. Rzym, Praga, Budapeszt i Barcelona są blisko i mają tanie połączenia z kilku polskich lotnisk.</p>
          <div className="cr-grid">
            {NY_TIPS.map((t) => <div key={t.title} className="region"><h3>{t.title}</h3><p>{t.text}</p></div>)}
          </div>
          <h2>Najczęstsze pytania</h2>
          <Faq items={NY_FAQ} />
        </article>
      </div>
    </>
  );
}
