import fs from 'fs';
import path from 'path';
import { allHotels, eximOffers, hotelForExim } from '@/lib/hotels';
import { normName } from '@/lib/hotelmatch';

export const dynamic = 'force-static';

// id hotelu z wakacje.pl -> karta hotelu; oraz "x:kraj:nazwa" dla ofert Exim
export function GET() {
  const map: Record<string, string> = {};
  for (const h of allHotels()) if (typeof h.id === 'number') map[h.id] = h.slug;
  const dir = path.join(process.cwd(), 'public', 'exim');
  const countries = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json').map((f) => f.slice(0, -5)) : [];
  for (const c of countries) {
    const seen = new Set<string>();
    for (const o of eximOffers(c)) {
      const k = `x:${c}:${normName(o.n)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const h = hotelForExim(c, o);
      if (h) map[k] = h.slug;
    }
  }
  return Response.json(map, { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } });
}
