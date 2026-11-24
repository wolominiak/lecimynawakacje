import type { Country } from '@/lib/types';
import { countryShape } from '@/lib/map';
import { imageFor, photoCredit } from '@/lib/images';
import { wakacjeUrl, gygSearchUrl } from '@/lib/affiliate';
import Crumbs from './Crumbs';

export default function CountryHero({ c, title, lead, crumbs, imgKey, wakacjePath, gygQ, eyebrow }: {
  c: Country; title: React.ReactNode; lead?: string; crumbs: { name: string; url?: string }[];
  imgKey?: string; wakacjePath?: string; gygQ?: string; eyebrow?: string;
}) {
  const own = imgKey ? imageFor(imgKey) : null;
  const img = own || imageFor(c.slug);
  const credit = img ? photoCredit(own ? imgKey! : c.slug) : null;
  const shape = countryShape(c.ccn3, c.code, 320);
  const tour = c.content?.touroperator;
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
              {tour && (
                <a className="btn" href={wakacjeUrl(wakacjePath || c.content?.wakacjePath || c.slug)} target="_blank" rel="sponsored nofollow noopener">
                  Zobacz oferty wakacji &rarr;
                </a>
              )}
              <a className={tour ? 'btn btn-ghost' : 'btn'} href={gygSearchUrl(gygQ || c.content?.gygQuery || c.name)} target="_blank" rel="sponsored nofollow noopener">
                Wycieczki i atrakcje
              </a>
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
