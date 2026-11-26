import type { Country } from '@/lib/types';
import { getByContinent, continentOf } from '@/lib/data';
import { wakacjeUrl } from '@/lib/affiliate';
import { EsimBox } from './Esim';
import { SidePromo } from './Promo';

const EXOTIC = new Set(['tajlandia', 'dominikana', 'tanzania', 'meksyk', 'malediwy', 'sri-lanka', 'wietnam', 'indonezja', 'kenia', 'kuba', 'mauritius', 'seszele']);

export default function Aside({ c, wakacjePath, ctaTitle }: { c: Country; wakacjePath?: string; ctaTitle?: string }) {
  const others = getByContinent(c.continent).filter((x) => x.slug !== c.slug && x.content).sort((a, b) => (b.content!.popularity || 0) - (a.content!.popularity || 0)).slice(0, 8);
  const ct = c.content;
  return (
    <aside className="aside">
      {ct?.touroperator && (
        <div className="box box-cta">
          <h3>{ctaTitle || `Wakacje ${ct.loc} w dobrej cenie`}</h3>
          <p>Porównaj oferty kilkudziesięciu biur podróży w jednym miejscu: all inclusive, last minute i first minute.</p>
          <a className="btn" href={wakacjeUrl(wakacjePath || ct.wakacjePath || c.slug)} target="_blank" rel="sponsored nofollow noopener">Sprawdź ceny &rarr;</a>
          <p style={{ fontSize: '0.78rem', margin: '10px 0 0', opacity: 0.8 }}>Oferty wakacje.pl, link partnerski</p>
        </div>
      )}
      <SidePromo seed={c.slug} exclude={EXOTIC.has(c.slug) ? 'egzotyka' : undefined} />
      <EsimBox c={c} />
      {!!ct?.regions?.length && (
        <div className="box">
          <h3>Regiony: {c.name}</h3>
          <ul>{ct.regions.map((r) => <li key={r.slug}><a href={`/wakacje/${c.slug}/${r.slug}/`}>{r.name} <span>&rarr;</span></a></li>)}</ul>
        </div>
      )}
      {others.length > 0 && (
        <div className="box">
          <h3>Inne kierunki: {continentOf(c.continent).name}</h3>
          <ul>{others.map((o) => <li key={o.slug}><a href={`/wakacje/${o.slug}/`}>{o.name} <span>&rarr;</span></a></li>)}</ul>
        </div>
      )}
    </aside>
  );
}
