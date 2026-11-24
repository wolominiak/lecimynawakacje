import { worldMap } from '@/lib/map';
import MapTooltip from './MapTooltip';

export default function WorldMap() {
  const m = worldMap();
  return (
    <div className="map-box">
      <MapTooltip width={m.width} height={m.height}>
        <svg className="map-svg" viewBox={`0 0 ${m.width} ${m.height}`} role="img" aria-label="Mapa świata - kliknij kraj, aby zobaczyć kierunek">
          <path className="sphere" d={m.sphere} />
          <path className="grat" d={m.graticule} />
          {m.shapes.map((s, i) =>
            s.slug ? (
              <a key={i} href={`/wakacje/${s.slug}/`} data-id={s.id} data-n={s.name} data-s={s.hasContent ? 'Przewodnik i oferty biur podróży' : 'Zobacz przewodnik'} aria-label={s.name}>
                <path className={'c' + (s.hasContent ? ' has' : '')} d={s.d} />
              </a>
            ) : (
              <path key={i} className="c none" d={s.d} data-id={s.id} />
            ),
          )}
          {m.dots.map((d) => (
            <a key={d.slug} href={`/wakacje/${d.slug}/`} data-n={d.name} data-s={d.hasContent ? 'Przewodnik i oferty biur podróży' : 'Zobacz przewodnik'} aria-label={d.name}>
              <circle className="dot" cx={d.x} cy={d.y} r={3.6} />
            </a>
          ))}
        </svg>
      </MapTooltip>
      <div className="map-legend">
        <span><i style={{ background: '#0b6e99' }} />Oferty biur podróży</span>
        <span><i style={{ background: '#bfddea' }} />Pozostałe kraje</span>
        <span><i style={{ background: '#ffb020' }} />Najedź i kliknij</span>
        <span className="hint">Kółko myszy, + lub dwuklik przybliża</span>
      </div>
    </div>
  );
}
