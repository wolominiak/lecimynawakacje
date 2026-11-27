import type { Country } from '@/lib/types';
import { countryShape } from '@/lib/map';
import { imageFor, photoCredit } from '@/lib/images';
import { gygSearchUrl } from '@/lib/affiliate';
import { availableSubpages } from '@/lib/data';
import Crumbs from './Crumbs';

export default function CountryHero({ c, title, lead, crumbs, imgKey, gygQ, eyebrow, offersHere }: {
  c: Country; title: React.ReactNode; lead?: string; crumbs: { name: string; url?: string }[];
  imgKey?: string; wakacjePath?: string; gygQ?: string; eyebrow?: string;
  /** wyszukiwarka ofert jest na tej stronie (region, zakładka oferty): przycisk przewija do niej */
  offersHere?: boolean;
}) {
  const own = imgKey ? imageFor(imgKey) : null;
  const img = own || imageFor(c.slug);
  const credit = img ? photoCredit(own ? imgKey! : c.slug) : null;
  const shape = countryShape(c.ccn3, c.code, 320);
  const subs = availableSubpages(c);
  const hasOffers = subs.includes('oferty');
  const offersHref = offersHere ? '#oferty' : `/wakacje/${c.slug}/oferty/`;
  const attrHref = subs.includes('atrakcje') ? `/wakacje/${c.slug}/atrakcje/` : null;
  return (
    <section className={'chero' + (img ? ' has-img' : '')}>
      {img && <img className="himg" src={img} alt="" fetchPriority="high" />}
      {credit && <a className="hcredit" href={credit.url} target="_blank" rel="nofollow noopener">Fot. {credit.by} / {credit.src || 'Pexels'}</a>}
      <div className="wrap">
        <div style={{ position: 'relative', zIndex: 2, paddingTop: 22 }}><Crumbs items={crumbs} /></div>
        <div className="chero-in">
          <div>
            {eyebrow && <span className="eyebrow" style={{ color: '#d9eef6' }}>{eyebrow}</span>}
            <h1 style={{ marginTop: eyebrow ? 12 : 0 }}>{title}</h1>
            {lead && <p className="lead">{lead}</p>}
            <div className="cta-row">
              {hasOffers && <a className="btn" href={offersHref}>Zobacz oferty wakacji &rarr;</a>}
              {attrHref
                ? <a className={hasOffers ? 'btn btn-ghost' : 'btn'} href={attrHref}>Wycieczki i atrakcje</a>
                : <a className={hasOffers ? 'btn btn-ghost' : 'btn'} href={gygSearchUrl(gygQ || c.content?.gygQuery || c.name)} target="_blank" rel="sponsored nofollow noopener">Wycieczki i atrakcje</a>}
            </div>
          </div>
          {shape && !img && (
            <svg className="silhouette" viewBox={`0 0 ${shape.size} ${shape.size}`} aria-hidden="true"><path d={shape.d} /></svg>
          )}
        </div>
      </div>
    </section>
  );
}
