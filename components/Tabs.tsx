import type { Country } from '@/lib/types';
import { availableSubpages, SUBPAGES } from '@/lib/data';

export default function Tabs({ c, active }: { c: Country; active: string }) {
  const subs = availableSubpages(c);
  if (!subs.length) return null;
  return (
    <nav className="tabs" aria-label={`Przewodnik: ${c.name}`}>
      <a href={`/wakacje/${c.slug}/`} className={active === '' ? 'on' : ''}>Przewodnik</a>
      {subs.map((s) => <a key={s} href={`/wakacje/${c.slug}/${s}/`} className={active === s ? 'on' : ''}>{SUBPAGES[s]}</a>)}
    </nav>
  );
}
