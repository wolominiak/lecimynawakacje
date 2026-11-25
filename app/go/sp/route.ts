import { NextRequest, NextResponse } from 'next/server';

// Wycieczka SeePlaces: ?k=<kraj>&id=<id> -> link śledzący TradeDoublera z feedu
const okHost = (u: string) => { try { const h = new URL(u).hostname; return h === 'ad.seeplaces.com' || h.endsWith('.tradedoubler.com'); } catch { return false; } };

export async function GET(req: NextRequest) {
  const k = (req.nextUrl.searchParams.get('k') || '').replace(/[^a-z0-9-]/g, '');
  const id = req.nextUrl.searchParams.get('id') || '';
  let u = '';
  try {
    const r = await fetch(`${req.nextUrl.origin}/seeplaces/${k}.json`);
    if (r.ok) u = ((await r.json()) as { id: string; u: string }[]).find((t) => t.id === id)?.u || '';
  } catch {}
  return NextResponse.redirect(okHost(u) ? u : 'https://clk.tradedoubler.com/click?p=383711&a=3453752&url=https%3A%2F%2Fwww.seeplaces.com%2Fpl%2F', 302);
}
