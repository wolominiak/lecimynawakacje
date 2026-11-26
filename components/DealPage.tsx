import LastMinuteBrowser from './LastMinuteBrowser';
import Crumbs from './Crumbs';
import Faq from './Faq';
import CategoryBar from './CategoryBar';
import { SeasonBanner } from './Promo';
import { catCountries, type DealCat } from '@/lib/categories';
import { getCountry } from '@/lib/data';

// Strona kategorii z wyszukiwarką ofert (all inclusive, tanie wakacje, nad morzem, egzotyka, objazdowe)
export default function DealPage({ cat }: { cat: DealCat }) {
  const list = catCountries(cat.countries);
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <Crumbs items={[{ name: cat.h1 }]} />
          <div className="hero-panel lm-hero">
            <span className="eyebrow">{cat.eyebrow}</span>
            <h1>{cat.h1}</h1>
            <p className="lead">{cat.lead}</p>
          </div>
        </div>
      </section>
      <div className="wrap"><CategoryBar active={cat.slug} /></div>
      <div className="wrap"><SeasonBanner /></div>
      <div className="wrap section-sm">
        <LastMinuteBrowser countries={list} cfg={cat.cfg} globalPool={cat.globalPool} />
      </div>
      <div className="wrap section-sm">
        <div className="sec-head"><div><span className="eyebrow">Przewodniki</span><h2>Sprawdź, zanim wybierzesz</h2></div></div>
        <div className="chips">
          {list.map((c) => { const k = getCountry(c.slug); return k ? <a key={c.slug} className="chip chip-light" href={`/wakacje/${c.slug}/${cat.slug === 'all-inclusive' && k.content?.allInclusive?.length ? 'all-inclusive/' : ''}`}>{k.name}</a> : null; })}
        </div>
      </div>
      <div className="wrap section-sm">
        <div className="layout" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <article className="prose" style={{ maxWidth: 860 }}>
            <h2>{cat.h1}: co warto wiedzieć</h2>
            {cat.intro.map((p, i) => <p key={i}>{p}</p>)}
            <div className="cr-grid">
              {cat.tips.map((t) => <div key={t.title} className="region"><h3>{t.title}</h3><p>{t.text}</p></div>)}
            </div>
            <h2>Najczęstsze pytania</h2>
            <Faq items={cat.faq} />
          </article>
        </div>
      </div>
    </>
  );
}
