import { worldMap } from '@/lib/map';
import MapTooltip from './MapTooltip';

export default function WorldMap() {
  const m = worldMap();
  return (
    <div className="map-box">
      <MapTooltip>
        <svg className="map-svg" viewBox={`0 0 ${m.width} ${m.height}`} role="img" aria-label="Mapa świata - kliknij kraj, aby zobaczyć kierunek">
          <path className="sphere" d={m.sphere} />
          <path className="grat" d={m.graticule} />
          {m.shapes.map((s, i) =>
            s.slug ? (
              <a key={i} href={`/wakacje/${s.slug}/`} data-n={s.name} data-s={s.hasContent ? 'Zobacz przewodnik i oferty' : 'Kliknij, aby zobaczyć'} aria-label={s.name}>
                <path className={'c' + (s.hasContent ? ' has' : '')} d={s.d} />
              </a>
            ) : (
              <path key={i} className="c none" d={s.d} />
            ),
          )}
          {m.dots.map((d) => (
            <a key={d.slug} href={`/wakacje/${d.slug}/`} data-n={d.name} data-s={d.hasContent ? 'Zobacz przewodnik i oferty' : 'Kliknij, aby zobaczyć'} aria-label={d.name}>
              <circle className="dot" cx={d.x} cy={d.y} r={3.6} />
            </a>
          ))}
        </svg>
      </MapTooltip>
      <div className="map-legend">
        <span><i style={{ background: '#5fb3b3' }} />Kierunki z przewodnikiem</span>
        <span><i style={{ background: '#2b6b80' }} />Pozostałe kraje</span>
        <span><i style={{ background: '#9fe0d6', borderRadius: '50%' }} />Małe państwa i wyspy</span>
        <span><i style={{ background: 'var(--sun)' }} />Najedź i kliknij</span>
      </div>
    </div>
  );
}
