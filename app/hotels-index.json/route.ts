import { allHotels } from '@/lib/hotels';

export const dynamic = 'force-static';

// id hotelu z wakacje.pl -> adres karty hotelu (do linków z list ofert)
export function GET() {
  const map: Record<number, string> = {};
  for (const h of allHotels()) map[h.id] = h.slug;
  return Response.json(map, { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } });
}
