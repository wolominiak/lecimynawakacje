import { NextRequest, NextResponse } from 'next/server';

// Zamaskowany link do oferty Exim (link śledzący TradeDoublera z feedu).
// Dwie formy: ?u=<link z feedu> albo krótka ?k=<kraj>&id=<id oferty> (używa asystent AI).
const okHost = (u: string) => {
  try { const h = new URL(u).hostname; return h === 'reklamy.exim.pl' || h === 'pdt.tradedoubler.com' || h === 'clk.tradedoubler.com'; } catch { return false; }
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  let u = sp.get('u') || '';
  const k = (sp.get('k') || '').replace(/[^a-z0-9-]/g, '');
  const id = sp.get('id') || '';
  if (!u && k && id) {
    try {
      const r = await fetch(`${req.nextUrl.origin}/exim/${k}.json`);
      if (r.ok) u = ((await r.json()) as { id: string; u: string }[]).find((o) => o.id === id)?.u || '';
    } catch {}
    if (!u) return NextResponse.redirect(`https://lecimynawakacje.pl/wakacje/${k}/oferty/`, 302);
  }
  return NextResponse.redirect(okHost(u) ? u : 'https://www.exim.pl/', 302);
}
