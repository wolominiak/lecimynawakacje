import { NextRequest, NextResponse } from 'next/server';

// Zamaskowany link do oferty Exim (link śledzący TradeDoublera z feedu)
export function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u') || '';
  let ok = false;
  try {
    const h = new URL(u).hostname;
    ok = h === 'reklamy.exim.pl' || h === 'pdt.tradedoubler.com' || h === 'clk.tradedoubler.com';
  } catch {}
  return NextResponse.redirect(ok ? u : 'https://www.exim.pl/', 302);
}
