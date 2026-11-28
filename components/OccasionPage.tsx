import Crumbs from './Crumbs';
import Faq from './Faq';
import CategoryBar from './CategoryBar';
import { imageFor } from '@/lib/images';
import { monthFlight, type Occasion } from '@/lib/occasions';

// Strona okazji (sylwester, walentynki): kierunki z linkami do ofert biur i loty na konkretne dni.
const fmt = (n: number) => n.toLocaleString('pl-PL');
const flightHref = (oc: Occasion, from: string, d: string) => `/go/lot/?o=${from}&d=${d}&dd=${oc.dep}&rd=${oc.ret}&a=2`;

export default function OccasionPage({ o }: { o: Occasion }) {
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <Crumbs items={[{ name: o.label }]} />
          <div className="hero-panel lm-hero">
            <span className="eyebrow">{o.eyebrow}</span>
            <h1>{o.h1}</h1>
            <p className="lead">{o.lead}</p>
            <div className="hero-cta">
              <a className="btn" href={o.allHref} target="_blank" rel="sponsored nofollow noopener">{o.allLabel}</a>
              <a className="btn btn-ghost" href="#miasta">{o.cityTitle}</a>
            </div>
          </div>
        </div>
      </section>
      <div className="wrap"><CategoryBar active={o.slug} /></div>

      <section className="wrap section-sm">
        <div className="sec-head"><div><span className="eyebrow">{o.warmEyebrow}</span><h2>{o.warmTitle}</h2></div></div>
        <p className="ny-note">{o.warmNote}</p>
        <div className="ny-grid">
          {o.warm.map((w) => {
            const img = imageFor(w.img, 'small');
            return (
              <div key={w.path} className="ny-card">
                <div className="ny-img" style={img ? { backgroundImage: `url(${img})` } : undefined}><span>{w.temp}</span></div>
                <div className="ny-body">
                  <h3>{w.name}</h3>
                  <p>{w.text}</p>
                  <div className="ny-actions">
                    <a className="btn" href={o.offerHref(w)} target="_blank" rel="sponsored nofollow noopener">{o.offerLabel}</a>
                    <a className="ny-link" href={w.guide}>Przewodnik</a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="wrap section-sm" id="miasta">
        <div className="sec-head"><div><span className="eyebrow">City break</span><h2>{o.cityTitle}</h2></div></div>
        <p className="ny-note">{o.cityNote}</p>
        <div className="ny-grid">
          {o.cities.map((c) => {
            const img = imageFor(c.img, 'small');
            const f = monthFlight(c.iata, o.month);
            return (
              <div key={c.iata} className="ny-card">
                <div className="ny-img" style={img ? { backgroundImage: `url(${img})` } : undefined}>{f && <span>loty w {o.month === '2026-12' ? 'grudniu' : 'lutym'} od {fmt(f.price)} zł</span>}</div>
                <div className="ny-body">
                  <h3>{c.name}</h3>
                  <p>{c.text}</p>
                  <div className="ny-actions">
                    <a className="btn" href={flightHref(o, f?.o || 'WAW', c.iata)} rel="nofollow">Loty {o.datesLabel}</a>
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
          <h2>{o.introTitle}</h2>
          {o.intro.map((p, i) => <p key={i}>{p}</p>)}
          <div className="cr-grid">
            {o.tips.map((t) => <div key={t.title} className="region"><h3>{t.title}</h3><p>{t.text}</p></div>)}
          </div>
          <h2>Najczęstsze pytania</h2>
          <Faq items={o.faq} />
        </article>
      </div>
    </>
  );
}
