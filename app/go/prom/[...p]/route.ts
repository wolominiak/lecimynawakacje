import { NextRequest, NextResponse } from 'next/server';
import { FERRY_COUNTRIES, FERRY_PLACES, tdUrl } from '@/lib/tradedoubler';

// Promy (Ferryhopper przez TradeDoubler). Strona wyspy, potem kraju, potem główna, sprawdzane raz na 7 dni.
async function exists(u: string) {
  try {
    const r = await fetch(u, { method: 'HEAD', redirect: 'manual', next: { revalidate: 604800 } } as RequestInit);
    return r.status === 200;
  } catch { return false; }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ p: string[] }> }) {
  const [kraj = '', region = ''] = (await params).p || [];
  const base = 'https://www.ferryhopper.com/pl';
  const c = FERRY_COUNTRIES[kraj];
  const place = FERRY_PLACES[`${kraj}/${region}`];
  const cands = [c && place ? `${base}/ferries/${c}/${place}` : '', c ? `${base}/ferries/${c}` : ''].filter(Boolean);
  let target = `${base}/`;
  for (const u of cands) if (await exists(u)) { target = u; break; }
  return NextResponse.redirect(tdUrl('ferryhopper', target), 302);
}
