import { searchItems } from '@/lib/search';

export const dynamic = 'force-static';

export function GET() {
  return Response.json(searchItems(), { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } });
}
