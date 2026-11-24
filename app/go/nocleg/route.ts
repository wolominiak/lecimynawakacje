import { NextRequest, NextResponse } from 'next/server';
import { tpUrl } from '@/lib/travelpayouts';

// Noclegi (Booking.com): wyszukiwanie po nazwie miejsca, po polsku
export function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').slice(0, 80);
  const target = q ? `https://www.booking.com/searchresults.pl.html?ss=${encodeURIComponent(q)}&lang=pl` : 'https://www.booking.com/index.pl.html';
  return NextResponse.redirect(tpUrl('booking', target), 302);
}
