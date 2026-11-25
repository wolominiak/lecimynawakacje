import Crumbs from './Crumbs';
import Faq from './Faq';
import CategoryBar from './CategoryBar';

// Wspólny szkielet stron usług: loty, hotele, auta, wycieczki
export default function ServiceHub({ slug, h1, eyebrow, lead, children, links, linksTitle, intro, faq }: {
  slug: string; h1: string; eyebrow: string; lead: string; children: React.ReactNode;
  links: { href: string; label: string }[]; linksTitle: string; intro: string[]; faq: { q: string; a: string }[];
}) {
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <Crumbs items={[{ name: h1 }]} />
          <div className="hero-panel lm-hero">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{h1}</h1>
            <p className="lead">{lead}</p>
            <div className="sh-box">{children}</div>
          </div>
        </div>
      </section>
      <div className="wrap"><CategoryBar active={slug} /></div>
      <div className="wrap section-sm">
        <div className="sec-head"><div><span className="eyebrow">Według kraju</span><h2>{linksTitle}</h2></div></div>
        <div className="chips">{links.map((l) => <a key={l.href} className="chip chip-light" href={l.href}>{l.label}</a>)}</div>
      </div>
      <div className="wrap section-sm">
        <div className="layout" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <article className="prose" style={{ maxWidth: 860 }}>
            <h2>Co warto wiedzieć</h2>
            {intro.map((p, i) => <p key={i}>{p}</p>)}
            <h2>Najczęstsze pytania</h2>
            <Faq items={faq} />
            <p className="ft-note">Linki partnerskie: rezerwując przez nie, nie płacisz więcej.</p>
          </article>
        </div>
      </div>
    </>
  );
}
