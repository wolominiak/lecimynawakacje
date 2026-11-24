import { geoNaturalEarth1, geoPath, geoMercator, geoGraticule } from 'd3-geo';
import { feature } from 'topojson-client';
import world110 from 'world-atlas/countries-110m.json';
import world50 from 'world-atlas/countries-50m.json';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { getCountries } from './data';

const W = 1000;
const H = 520;

// Kształty bez kodu ISO w world-atlas
const NAME_FIX: Record<string, string> = { Kosovo: 'XK', 'N. Cyprus': 'CY', Somaliland: 'SO' };

export interface MapShape {
  id: string;
  d: string;
  slug: string | null;
  name: string;
  hasContent: boolean;
}
export interface MapDot {
  x: number;
  y: number;
  slug: string;
  name: string;
  hasContent: boolean;
}

export function worldMap() {
  const countries = getCountries();
  const byNum = new Map(countries.filter((c) => c.ccn3).map((c) => [c.ccn3!, c]));
  const byCode = new Map(countries.map((c) => [c.code, c]));
  const fc = feature(world110 as any, (world110 as any).objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>;

  const projection = geoNaturalEarth1().fitExtent([[4, 4], [W - 4, H - 4]], { type: 'Sphere' } as any);
  const path = geoPath(projection).digits(0);

  const used = new Set<string>();
  const shapes: MapShape[] = [];
  for (const f of fc.features) {
    if (f.properties.name === 'Antarctica') continue;
    const id = (f as Feature).id as string | undefined;
    const c = (id && byNum.get(id)) || byCode.get(NAME_FIX[f.properties.name] || '');
    if (c) used.add(c.code);
    const d = path(f);
    if (!d) continue;
    shapes.push({ id: String(id ?? f.properties.name), d, slug: c?.slug || null, name: c?.name || f.properties.name, hasContent: !!c?.content?.touroperator });
  }

  // Małe państwa i wyspy, których nie widać w skali 1:110m -> kropki
  const dots: MapDot[] = [];
  for (const c of countries) {
    if (used.has(c.code) || !c.latlng) continue;
    const p = projection([c.latlng[1], c.latlng[0]]);
    if (!p) continue;
    dots.push({ x: Math.round(p[0] * 10) / 10, y: Math.round(p[1] * 10) / 10, slug: c.slug, name: c.name, hasContent: !!c.content?.touroperator });
  }

  // Tło i siatka: zgrubna precyzja, bo to tylko dekoracja (wcześniej 38 KB)
  const coarse = geoPath(projection).digits(0);
  const sphere = coarse({ type: 'Sphere' } as any) || '';
  const graticule = coarse(geoGraticule().step([20, 20]).precision(10)()) || '';
  return { width: W, height: H, shapes, dots, sphere, graticule };
}

/** Sylwetka jednego kraju (dokładniejsza skala 1:50m) do nagłówka strony */
let fc50: FeatureCollection<Geometry, { name: string }> | null = null;
const shapeCache = new Map<string, { d: string; size: number } | null>();
export function countryShape(ccn3: string | null, code: string, size = 320) {
  const key = code + size;
  if (shapeCache.has(key)) return shapeCache.get(key)!;
  const r = buildShape(ccn3, code, size);
  shapeCache.set(key, r);
  return r;
}
function buildShape(ccn3: string | null, code: string, size: number) {
  if (!fc50) fc50 = feature(world50 as any, (world50 as any).objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>;
  const fc = fc50;
  let f = fc.features.find((x) => ccn3 && (x as Feature).id === ccn3);
  if (!f) {
    const name = Object.entries(NAME_FIX).find(([, v]) => v === code)?.[0];
    if (name) f = fc.features.find((x) => x.properties.name === name);
  }
  if (!f) return null;
  // Kraje przecinające południk 180 (Rosja, Fidżi, Kiribati) dają złe kontury - pomijamy
  if (['RU', 'FJ', 'KI', 'US'].includes(code)) return null;
  const projection = geoMercator().fitExtent([[8, 8], [size - 8, size - 8]], f as any);
  const d = geoPath(projection).digits(0)(f as any);
  if (!d || d.length > 120000) return null;
  return { d, size };
}
