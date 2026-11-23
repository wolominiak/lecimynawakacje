import { MONTHS } from '@/lib/data';
import type { CountryContent } from '@/lib/types';

export default function Climate({ c }: { c: CountryContent }) {
  if (!c.climate) return null;
  const { air, sea } = c.climate;
  const max = Math.max(...air, 30);
  const best = c.bestTime?.best || [];
  const ok = c.bestTime?.ok || [];
  return (
    <div className="climate">
      <div className="climate-bars">
        {air.map((t, i) => (
          <div key={i} className={'cb' + (best.includes(i + 1) ? ' best' : ok.includes(i + 1) ? ' ok' : '')} title={`${MONTHS[i].name}: ${t}°C`}>
            <span className="v">{t}°</span>
            <div className="bar" style={{ height: `${Math.max(8, (t / max) * 100)}%` }} />
            <span className="m">{MONTHS[i].name.slice(0, 3)}</span>
            {sea && <span className="sea">{sea[i]}°</span>}
          </div>
        ))}
      </div>
      <div className="climate-legend">
        <span><i style={{ background: 'var(--sun)' }} />Najlepszy czas</span>
        <span><i style={{ background: '#ffd2b8' }} />Dobry czas</span>
        <span><i style={{ background: '#cfe9e7' }} />Poza sezonem</span>
        <span>Słupki: średnia maks. temperatura powietrza{sea ? ', na dole turkusowo: temperatura wody' : ''}</span>
      </div>
      {c.climate.note && <p className="muted" style={{ fontSize: '0.88rem', margin: '10px 0 0' }}>{c.climate.note}</p>}
    </div>
  );
}
