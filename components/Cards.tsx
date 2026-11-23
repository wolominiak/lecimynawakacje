import type { Country } from '@/lib/types';
import { countryShape } from '@/lib/map';
import { imageFor } from '@/lib/images';

const GRADS: Record<string, string> = {
  europa: 'linear-gradient(150deg,#0a4d68,#1f8a9a)',
  afryka: 'linear-gradient(150deg,#b4441f,#f08a3c)',
  azja: 'linear-gradient(150deg,#0e6b5c,#3fb39a)',
  'ameryka-polnocna': 'linear-gradient(150deg,#123c7a,#3a7bd5)',
  'ameryka-poludniowa': 'linear-gradient(150deg,#5b2a86,#b25bc4)',
  'australia-i-oceania': 'linear-gradient(150deg,#0b6e99,#36c2d6)',
};

export function DestCard({ c, big, tag }: { c: Country; big?: boolean; tag?: string }) {
  const img = imageFor(c.slug);
  const shape = img ? null : countryShape(c.ccn3, c.code, 300);
  return (
    <a href={`/wakacje/${c.slug}/`} className={'dcard' + (big ? ' big' : '')}>
      <div className="bg" style={{ background: GRADS[c.continent] }}>
        {img && <img src={img} alt={`Wakacje ${c.content?.loc || c.name}`} loading="lazy" />}
      </div>
      {shape && (
        <svg className="shape" viewBox={`0 0 ${shape.size} ${shape.size}`} aria-hidden="true"><path d={shape.d} /></svg>
      )}
      {tag && <span className="tag">{tag}</span>}
      <h3>{c.name}</h3>
      {c.content?.teaser && <p>{c.content.teaser}</p>}
    </a>
  );
}

export function contGradient(slug: string) {
  return GRADS[slug];
}
