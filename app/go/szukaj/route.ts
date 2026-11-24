import { NextRequest, NextResponse } from 'next/server';
import { trackingQuery } from '@/lib/tracking';

// Wyszukiwanie z terminem: /go/szukaj/?p=grecja&f=od-2027-07-01,do-2027-07-31,7-dni,samolotem
export function GET(req: NextRequest) {
  const p = (req.nextUrl.searchParams.get('p') || '').replace(/[^a-z0-9-]/gi, '');
  const f = (req.nextUrl.searchParams.get('f') || '').replace(/[^a-z0-9,-]/gi, '');
  const base = 'https://www.wakacje.pl/wczasy/' + (p ? p + '/' : '');
  return NextResponse.redirect(base + '?' + (f ? f + '&' : '') + trackingQuery('szukaj-z-terminem'), 302);
}
