import { NextRequest, NextResponse } from 'next/server';
import { trackingQuery } from '@/lib/tracking';

// Zamaskowany link do konkretnej oferty: /go/oferta/?u=/oferty/grecja/...html?od-...
export function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u') || '';
  // tylko ścieżki ofert wakacje.pl, bez otwartego przekierowania
  if (!/^\/oferty\/[a-z0-9\-/.,?=_]+$/i.test(u)) return NextResponse.redirect('https://www.wakacje.pl/?' + trackingQuery(), 302);
  const url = 'https://www.wakacje.pl' + u + (u.includes('?') ? '&' : '?') + trackingQuery();
  return NextResponse.redirect(url, 302);
}
